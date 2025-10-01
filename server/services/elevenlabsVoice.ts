import FormData from 'form-data';
import fs from 'fs';

interface ElevenLabsVoiceResponse {
  audioBuffer: Buffer;
  text: string;
}

export class ElevenLabsVoiceService {
  private apiKey: string;
  private voiceId: string | null = null;

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || '';
  }

  /**
   * Clone a voice from an audio file
   * Requires at least 1 minute of clear audio for instant cloning
   */
  async cloneVoice(audioFilePath: string, voiceName: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('name', voiceName);
      formData.append('files', fs.createReadStream(audioFilePath));
      formData.append('description', 'Professional voice for Disaster Direct platform');

      const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          ...formData.getHeaders()
        },
        body: formData as any
      });

      if (!response.ok) {
        throw new Error(`Voice cloning failed: ${response.statusText}`);
      }

      const result = await response.json() as { voice_id: string };
      this.voiceId = result.voice_id;
      
      console.log(`✅ Voice cloned successfully. Voice ID: ${this.voiceId}`);
      return this.voiceId;
    } catch (error) {
      console.error('ElevenLabs voice cloning error:', error);
      throw error;
    }
  }

  /**
   * Generate speech using cloned voice or preset voice
   */
  async generateSpeech(text: string, voiceId?: string): Promise<Buffer> {
    try {
      const targetVoiceId = voiceId || this.voiceId || '21m00Tcm4TlvDq8ikWAM'; // Default: Rachel voice

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${targetVoiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_turbo_v2_5', // Latest high-quality model
            voice_settings: {
              stability: 0.7, // Higher = more consistent, lower = more expressive
              similarity_boost: 0.8, // Higher = closer to original voice
              style: 0.5, // Style exaggeration (0-1)
              use_speaker_boost: true // Enhance voice clarity
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Speech generation failed: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('ElevenLabs speech generation error:', error);
      throw error;
    }
  }

  /**
   * List all available voices (including cloned voices)
   */
  async listVoices(): Promise<any[]> {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      const result = await response.json() as { voices: any[] };
      return result.voices;
    } catch (error) {
      console.error('Error listing voices:', error);
      throw error;
    }
  }

  /**
   * Delete a cloned voice
   */
  async deleteVoice(voiceId: string): Promise<void> {
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
        method: 'DELETE',
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Voice deletion failed: ${response.statusText}`);
      }

      console.log(`✅ Voice ${voiceId} deleted successfully`);
    } catch (error) {
      console.error('Error deleting voice:', error);
      throw error;
    }
  }
}

export const elevenlabsVoice = new ElevenLabsVoiceService();
