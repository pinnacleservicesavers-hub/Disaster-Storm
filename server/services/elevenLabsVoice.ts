import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import fs from 'fs';

export interface ElevenLabsVoiceSettings {
  stability?: number; // 0-1, higher = more stable/consistent
  similarityBoost?: number; // 0-1, higher = closer to original voice
  style?: number; // 0-1, exaggeration of speaker style
  useSpeakerBoost?: boolean; // Enhance voice clarity
}

export interface CloneVoiceRequest {
  name: string;
  description?: string;
  audioFilePath: string;
  labels?: Record<string, string>;
}

export interface CloneVoiceResponse {
  voiceId: string;
  name: string;
  category: string;
  description?: string;
}

export interface GenerateSpeechRequest {
  text: string;
  voiceId: string;
  modelId?: string;
  settings?: ElevenLabsVoiceSettings;
  outputFormat?: 'mp3_44100_128' | 'pcm_16000' | 'pcm_22050' | 'pcm_24000' | 'pcm_44100';
}

export class ElevenLabsVoiceService {
  private client: ElevenLabsClient | null = null;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.ELEVENLABS_API_KEY || '';
    if (key) {
      this.client = new ElevenLabsClient({ apiKey: key });
    } else {
      console.warn('⚠️ ElevenLabs API key not configured - voice cloning disabled');
    }
  }

  /**
   * Clone a voice from an audio file
   */
  async cloneVoice(request: CloneVoiceRequest): Promise<CloneVoiceResponse> {
    if (!this.client) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      console.log('🎙️ Cloning voice with ElevenLabs:', request.name);

      // Read the audio file
      const audioData = fs.readFileSync(request.audioFilePath);
      
      // Clone the voice using Professional Voice Cloning (PVC)
      const result = await this.client.voices.pvc.create({
        name: request.name,
        description: request.description,
        files: [audioData],
        language: 'en', // English language
        labels: request.labels
      });
      
      console.log('✅ Voice cloned successfully. Full response:', JSON.stringify(result, null, 2));
      
      // Extract voice ID from response (could be voice_id or voiceId)
      const voiceId = (result as any).voice_id || (result as any).voiceId;
      console.log('🆔 Extracted voice ID:', voiceId);

      return {
        voiceId,
        name: request.name,
        category: 'cloned',
        description: request.description
      };
    } catch (error) {
      console.error('ElevenLabs voice cloning error:', error);
      throw error;
    }
  }

  /**
   * Generate speech from text using a voice
   */
  async generateSpeech(request: GenerateSpeechRequest): Promise<Buffer> {
    if (!this.client) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      // Enhanced settings for broadcast quality
      const voiceSettings = {
        stability: request.settings?.stability ?? 0.5, // Balanced stability
        similarity_boost: request.settings?.similarityBoost ?? 0.75, // High similarity to original
        style: request.settings?.style ?? 0.3, // Moderate style exaggeration
        use_speaker_boost: request.settings?.useSpeakerBoost ?? true // Enhanced clarity
      };

      const modelId = request.modelId || 'eleven_monolingual_v1'; // High quality model

      console.log('🎙️ Generating speech with ElevenLabs...');

      const audio = await this.client.textToSpeech.convert(request.voiceId, {
        text: request.text,
        model_id: modelId,
        voice_settings: voiceSettings
      });

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of audio) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      console.log('✅ Speech generated successfully');
      return buffer;
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      throw error;
    }
  }

  /**
   * List available voices
   */
  async listVoices(): Promise<any[]> {
    if (!this.client) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await this.client.voices.getAll();
      return response.voices || [];
    } catch (error) {
      console.error('ElevenLabs list voices error:', error);
      throw error;
    }
  }

  /**
   * Delete a cloned voice
   */
  async deleteVoice(voiceId: string): Promise<void> {
    if (!this.client) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      await this.client.voices.delete(voiceId);
      console.log('✅ Voice deleted successfully:', voiceId);
    } catch (error) {
      console.error('ElevenLabs delete voice error:', error);
      throw error;
    }
  }

  /**
   * Check if ElevenLabs is available
   */
  isAvailable(): boolean {
    return !!this.client;
  }
}

export const elevenLabsVoice = new ElevenLabsVoiceService();
