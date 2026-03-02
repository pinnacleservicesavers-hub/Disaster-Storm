import type { Request, Response } from "express";
import type { Application } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { videoGenerationService } from "../services/videoGenerationService";

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = '/tmp/video-uploads';
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `upload-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage: uploadStorage, limits: { fileSize: 20 * 1024 * 1024 } });

export function registerVideoGenerationRoutes(app: Application) {

  app.get('/api/video-gen/engines', async (req: Request, res: Response) => {
    try {
      const engines = videoGenerationService.getEngines();
      res.json({ success: true, engines });
    } catch (error) {
      console.error('Error fetching video engines:', error);
      res.status(500).json({ error: 'Failed to fetch video engines', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/api/video-gen/status', async (req: Request, res: Response) => {
    try {
      const status = videoGenerationService.getEngineStatus();
      res.json({ success: true, status });
    } catch (error) {
      console.error('Error fetching engine status:', error);
      res.status(500).json({ error: 'Failed to fetch engine status', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/api/video-gen/generate', async (req: Request, res: Response) => {
    try {
      const { engine, prompt, options } = req.body;

      if (!engine) {
        return res.status(400).json({ error: 'Engine is required' });
      }
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const job = await videoGenerationService.generateVideo(engine, prompt, options || {});
      res.json({ success: true, job });
    } catch (error) {
      console.error('Error generating video:', error);
      res.status(500).json({ error: 'Failed to generate video', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/api/video-gen/job/:engine/:jobId', async (req: Request, res: Response) => {
    try {
      const { engine, jobId } = req.params;
      const job = await videoGenerationService.checkJobStatus(engine, jobId);
      res.json({ success: true, job });
    } catch (error) {
      console.error('Error checking job status:', error);
      res.status(500).json({ error: 'Failed to check job status', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/api/video-gen/generate-cinematic', upload.single('photo'), async (req: Request, res: Response) => {
    try {
      const { prompt, industry, voice, enableVoiceover, duration, style, multiFormat } = req.body;
      if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

      const options: any = {
        industry: industry || undefined,
        voice: voice || 'deep-male',
        enableVoiceover: enableVoiceover !== 'false',
        duration: duration ? parseInt(duration) : 12,
        style: style || undefined,
        multiFormat: multiFormat !== 'false',
      };

      if (req.file) {
        options.uploadedPhotoPath = req.file.path;
        console.log(`📸 Uploaded brand photo: ${req.file.path}`);
      }

      const job = await videoGenerationService.generateVideo('cinematic-ai', prompt, options);
      res.json({ success: true, job });
    } catch (error) {
      console.error('Cinematic generation error:', error);
      res.status(500).json({ error: 'Failed to start cinematic video generation', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/api/video-gen/edit', async (req: Request, res: Response) => {
    try {
      const { message, currentPrompt, currentSettings } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Edit message is required' });
      }

      const systemPrompt = `You are an AI video editing assistant for a contractor marketing platform. The user has an existing AI-generated video and wants to make changes. Your job is to interpret their edit instructions and return an updated video generation prompt plus any settings changes.

Current video prompt: "${currentPrompt || ''}"
Current settings: ${JSON.stringify(currentSettings || {})}

Based on the user's edit instruction, return a JSON object with:
- "updatedPrompt": the full updated prompt incorporating the requested changes
- "settingsChanges": an object with any settings to change, such as:
  - "addEffects": array of effect IDs to add (lightning, fire, glitch, smoke, sparks, rain, confetti, lens-flare)
  - "removeEffects": array of effect IDs to remove
  - "style": new style mode if changing (aggressive, funny-meme, family-safe, luxury, storm-emergency, discount-push)
  - "duration": new duration in seconds if changing
  - "aspectRatio": new aspect ratio if changing (16:9, 9:16, 1:1)
  - "resolution": new resolution if changing (720p, 1080p, 4k)
  - "voice": new voice preset if changing
  - "textOverlays": array of {text, position, style} for text additions
- "summary": a brief human-readable summary of what changes were made
- "editType": one of "prompt_only", "settings_only", "both"

Be creative in translating casual instructions into professional video direction. For example:
- "make it darker" → update lighting in prompt, maybe add smoke effect
- "add lightning" → add lightning effect, update prompt with storm elements
- "make text bigger and yellow" → add textOverlays with bold yellow style
- "speed it up" → reduce duration
- "make it more aggressive" → change style to aggressive`;

      try {
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI();
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          response_format: { type: 'json_object' },
          max_tokens: 1500,
        });

        const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
        res.json({ success: true, edit: {
          updatedPrompt: result.updatedPrompt || currentPrompt || '',
          settingsChanges: result.settingsChanges || {},
          summary: result.summary || 'Changes applied',
          editType: result.editType || 'both'
        }});
      } catch (aiError) {
        const lowerMsg = message.toLowerCase();
        const settingsChanges: any = {};
        let updatedPrompt = currentPrompt || '';
        let summary = '';

        if (lowerMsg.includes('lightning') || lowerMsg.includes('storm')) {
          settingsChanges.addEffects = ['lightning'];
          updatedPrompt += ' Add dramatic lightning strikes and storm atmosphere.';
          summary = 'Added lightning effects and storm atmosphere';
        }
        if (lowerMsg.includes('fire') || lowerMsg.includes('flames')) {
          settingsChanges.addEffects = [...(settingsChanges.addEffects || []), 'fire'];
          updatedPrompt += ' Add fire and flame effects.';
          summary += (summary ? '. ' : '') + 'Added fire effects';
        }
        if (lowerMsg.includes('dark') || lowerMsg.includes('darker')) {
          updatedPrompt += ' Make the overall lighting darker and more dramatic with deep shadows.';
          summary += (summary ? '. ' : '') + 'Darkened lighting with dramatic shadows';
        }
        if (lowerMsg.includes('bright') || lowerMsg.includes('lighter')) {
          updatedPrompt += ' Make the lighting brighter and more vibrant.';
          summary += (summary ? '. ' : '') + 'Brightened lighting';
        }
        if (lowerMsg.includes('aggressive') || lowerMsg.includes('intense')) {
          settingsChanges.style = 'aggressive';
          summary += (summary ? '. ' : '') + 'Changed style to Aggressive';
        }
        if (lowerMsg.includes('funny') || lowerMsg.includes('meme')) {
          settingsChanges.style = 'funny-meme';
          summary += (summary ? '. ' : '') + 'Changed style to Funny Meme';
        }
        if (lowerMsg.includes('luxury') || lowerMsg.includes('premium') || lowerMsg.includes('elegant')) {
          settingsChanges.style = 'luxury';
          summary += (summary ? '. ' : '') + 'Changed style to Luxury';
        }
        if (lowerMsg.includes('faster') || lowerMsg.includes('speed up') || lowerMsg.includes('shorter')) {
          settingsChanges.duration = Math.max(3, (currentSettings?.duration || 10) - 3);
          summary += (summary ? '. ' : '') + 'Shortened video duration';
        }
        if (lowerMsg.includes('longer') || lowerMsg.includes('slow') || lowerMsg.includes('extend')) {
          settingsChanges.duration = Math.min(30, (currentSettings?.duration || 10) + 5);
          summary += (summary ? '. ' : '') + 'Extended video duration';
        }
        if (lowerMsg.includes('vertical') || lowerMsg.includes('portrait') || lowerMsg.includes('tiktok')) {
          settingsChanges.aspectRatio = '9:16';
          summary += (summary ? '. ' : '') + 'Changed to vertical format';
        }
        if (lowerMsg.includes('text') || lowerMsg.includes('title') || lowerMsg.includes('caption')) {
          const textMatch = message.match(/["']([^"']+)["']/);
          settingsChanges.textOverlays = [{ text: textMatch ? textMatch[1] : 'CALL NOW', position: 'center', style: 'bold-yellow' }];
          summary += (summary ? '. ' : '') + 'Added text overlay';
        }
        if (lowerMsg.includes('glitch')) {
          settingsChanges.addEffects = [...(settingsChanges.addEffects || []), 'glitch'];
          updatedPrompt += ' Add digital glitch distortion effects.';
          summary += (summary ? '. ' : '') + 'Added glitch effects';
        }
        if (lowerMsg.includes('smoke') || lowerMsg.includes('fog')) {
          settingsChanges.addEffects = [...(settingsChanges.addEffects || []), 'smoke'];
          updatedPrompt += ' Add atmospheric smoke and fog.';
          summary += (summary ? '. ' : '') + 'Added smoke/fog effects';
        }

        if (!summary) {
          updatedPrompt += ` ${message}`;
          summary = `Applied edit: "${message}"`;
        }

        res.json({
          success: true,
          edit: {
            updatedPrompt,
            settingsChanges,
            summary,
            editType: Object.keys(settingsChanges).length > 0 ? 'both' : 'prompt_only'
          }
        });
      }
    } catch (error) {
      console.error('Error processing video edit:', error);
      res.status(500).json({ error: 'Failed to process edit', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  console.log('🎬 Video Generation routes registered');
}
