import type { Request, Response } from "express";
import type { Application } from "express";
import { videoGenerationService } from "../services/videoGenerationService";

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

  console.log('🎬 Video Generation routes registered');
}
