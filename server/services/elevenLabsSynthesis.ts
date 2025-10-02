import { promises as fs } from 'fs';
import path from 'path';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'E8qtV3izSOr5vmxy1BHV';
const BASE_URL = 'https://api.elevenlabs.io/v1';

export async function synthesizeLine(text: string): Promise<string> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key not configured');
  }

  const response = await fetch(`${BASE_URL}/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  const tmpDir = '/tmp';
  const fileName = `line-${Date.now()}.mp3`;
  const filePath = path.join(tmpDir, fileName);
  
  await fs.writeFile(filePath, buffer);
  
  return filePath;
}

export async function synthesizeForTwilio(text: string, baseUrl: string): Promise<string> {
  const mp3Path = await synthesizeLine(text);
  const fileName = path.basename(mp3Path);
  return `${baseUrl}/media/${fileName}`;
}
