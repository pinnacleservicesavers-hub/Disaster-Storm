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

export interface ConversationalAgentConfig {
  name: string;
  prompt: string;
  firstMessage?: string;
  voiceId?: string;
  language?: string;
  modelId?: string;
  maxDurationSeconds?: number;
  tools?: ConversationalTool[];
  knowledgeBase?: string[];
}

export interface ConversationalTool {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string }>;
  webhookUrl?: string;
}

export interface ConversationalAgentResponse {
  agentId: string;
  name: string;
  status: string;
  signedUrl?: string;
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
      // ULTRA-NATURAL settings for human-like speech (tuned for broadcast quality)
      // Lower stability = more expressive variation (like real humans)
      // Higher similarity = maintains voice character
      // Higher style = natural inflection and emotion
      const voiceSettings = {
        stability: request.settings?.stability ?? 0.30, // Lower = more natural variation/expression
        similarity_boost: request.settings?.similarityBoost ?? 0.80, // Good balance of voice clarity
        style: request.settings?.style ?? 0.55, // Higher = more natural emotional inflection  
        use_speaker_boost: request.settings?.useSpeakerBoost ?? true // Enhanced clarity
      };

      // Use eleven_multilingual_v2 for most natural, emotional voice quality
      // This is ElevenLabs' most realistic model with best prosody
      const modelId = request.modelId || 'eleven_multilingual_v2';

      console.log('🎙️ Generating speech with ElevenLabs...');

      // Use the official SDK API format
      const audio = await (this.client as any).textToSpeech.convert(request.voiceId, {
        text: request.text,
        model_id: modelId,
        voice_settings: voiceSettings
      });

      // Convert response to buffer - handle different return types
      let buffer: Buffer;
      if (audio instanceof Buffer) {
        buffer = audio;
      } else if (audio instanceof ArrayBuffer) {
        buffer = Buffer.from(audio);
      } else if (audio && typeof audio.arrayBuffer === 'function') {
        // Blob or Response object
        const arrayBuf = await audio.arrayBuffer();
        buffer = Buffer.from(arrayBuf);
      } else if (Symbol.asyncIterator in (audio as any)) {
        const chunks: Uint8Array[] = [];
        for await (const chunk of audio as AsyncIterable<Uint8Array>) {
          chunks.push(chunk);
        }
        buffer = Buffer.concat(chunks);
      } else if (Array.isArray(audio)) {
        buffer = Buffer.concat(audio);
      } else if (audio && typeof audio.getReader === 'function') {
        // ReadableStream
        const chunks: Uint8Array[] = [];
        const reader = audio.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) chunks.push(value);
        }
        buffer = Buffer.concat(chunks);
      } else {
        throw new Error('Unknown audio format from ElevenLabs');
      }

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

  // ===== CONVERSATIONAL AI AGENTS =====

  /**
   * Create a conversational AI agent
   */
  async createAgent(config: ConversationalAgentConfig): Promise<ConversationalAgentResponse> {
    if (!this.client) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      console.log('🤖 Creating ElevenLabs Conversational AI agent:', config.name);

      const agent = await (this.client as any).conversationalAi.agents.create({
        name: config.name,
        conversationConfig: {
          agent: {
            prompt: {
              prompt: config.prompt,
            },
            firstMessage: config.firstMessage || "Hello! How can I help you today?",
            language: config.language || "en",
          },
          tts: {
            voiceId: config.voiceId || "JBFqnCBsd6RMkjVDRZzb", // Default: Adam voice
            modelId: config.modelId || "eleven_flash_v2_5", // Best for real-time agents
          },
        },
      });

      console.log('✅ Conversational AI agent created:', agent.agent_id || agent.agentId);

      return {
        agentId: agent.agent_id || agent.agentId,
        name: config.name,
        status: 'active',
      };
    } catch (error) {
      console.error('ElevenLabs create agent error:', error);
      throw error;
    }
  }

  /**
   * Get a conversational AI agent by ID
   */
  async getAgent(agentId: string): Promise<any> {
    if (!this.client) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const agent = await (this.client as any).conversationalAi.agents.get(agentId);
      return agent;
    } catch (error) {
      console.error('ElevenLabs get agent error:', error);
      throw error;
    }
  }

  /**
   * Update a conversational AI agent
   */
  async updateAgent(agentId: string, config: Partial<ConversationalAgentConfig>): Promise<any> {
    if (!this.client) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      console.log('🔄 Updating ElevenLabs agent:', agentId);

      const updatePayload: any = {};
      
      if (config.name) updatePayload.name = config.name;
      if (config.prompt || config.firstMessage || config.language) {
        updatePayload.conversationConfig = {
          agent: {
            ...(config.prompt && { prompt: { prompt: config.prompt } }),
            ...(config.firstMessage && { firstMessage: config.firstMessage }),
            ...(config.language && { language: config.language }),
          },
        };
      }
      if (config.voiceId || config.modelId) {
        updatePayload.conversationConfig = updatePayload.conversationConfig || {};
        updatePayload.conversationConfig.tts = {
          ...(config.voiceId && { voiceId: config.voiceId }),
          ...(config.modelId && { modelId: config.modelId }),
        };
      }

      const agent = await (this.client as any).conversationalAi.agents.update(agentId, updatePayload);
      console.log('✅ Agent updated successfully');
      return agent;
    } catch (error) {
      console.error('ElevenLabs update agent error:', error);
      throw error;
    }
  }

  /**
   * Delete a conversational AI agent
   */
  async deleteAgent(agentId: string): Promise<void> {
    if (!this.client) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      await (this.client as any).conversationalAi.agents.delete(agentId);
      console.log('✅ Agent deleted:', agentId);
    } catch (error) {
      console.error('ElevenLabs delete agent error:', error);
      throw error;
    }
  }

  /**
   * Get signed URL for client-side agent access (secure, no API key exposure)
   */
  async getAgentSignedUrl(agentId: string): Promise<string> {
    if (!this.client) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const result = await (this.client as any).conversationalAi.agents.getSignedUrl(agentId);
      return result.signed_url || result.signedUrl;
    } catch (error) {
      console.error('ElevenLabs get signed URL error:', error);
      throw error;
    }
  }

  /**
   * List all conversational AI agents
   */
  async listAgents(): Promise<any[]> {
    if (!this.client) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await (this.client as any).conversationalAi.agents.getAll();
      return response.agents || [];
    } catch (error) {
      console.error('ElevenLabs list agents error:', error);
      throw error;
    }
  }

  /**
   * Get conversation history for an agent
   */
  async getConversations(agentId: string, options?: { startDate?: string; endDate?: string }): Promise<any[]> {
    if (!this.client) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await (this.client as any).conversationalAi.conversations.list({
        agent_id: agentId,
        ...options,
      });
      return response.conversations || [];
    } catch (error) {
      console.error('ElevenLabs get conversations error:', error);
      throw error;
    }
  }
}

export const elevenLabsVoice = new ElevenLabsVoiceService();
