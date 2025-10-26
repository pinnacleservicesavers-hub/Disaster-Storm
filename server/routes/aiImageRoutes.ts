/**
 * AI Image Generation Routes
 * Endpoints for generating custom module backgrounds with DALL-E
 */

import { Router } from 'express';
import { generateModuleImage, generateAllModuleImages, type ModuleImageRequest } from '../services/aiImageGenerator';
import { MODULE_THEMES } from '../../shared/moduleThemes';

const router = Router();

/**
 * POST /api/ai-images/generate/:moduleId
 * Generate AI image for a specific module
 */
router.post('/generate/:moduleId', async (req, res) => {
  try {
    const { moduleId } = req.params;
    
    const theme = MODULE_THEMES[moduleId];
    if (!theme) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const request: ModuleImageRequest = {
      moduleId: theme.id,
      title: theme.title,
      description: theme.description,
      prompt: theme.dallePrompt
    };

    const result = await generateModuleImage(request);
    
    res.json({
      success: true,
      image: result
    });

  } catch (error) {
    console.error('Error generating module image:', error);
    res.status(500).json({ 
      error: 'Failed to generate image',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/ai-images/generate-all
 * Generate AI images for all modules
 */
router.post('/generate-all', async (req, res) => {
  try {
    const modules: ModuleImageRequest[] = Object.values(MODULE_THEMES).map(theme => ({
      moduleId: theme.id,
      title: theme.title,
      description: theme.description,
      prompt: theme.dallePrompt
    }));

    // Start generation in background
    generateAllModuleImages(modules).catch(error => {
      console.error('Background image generation failed:', error);
    });

    res.json({
      success: true,
      message: `Started generating ${modules.length} module images`,
      modules: modules.map(m => m.moduleId)
    });

  } catch (error) {
    console.error('Error starting batch generation:', error);
    res.status(500).json({ 
      error: 'Failed to start generation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/ai-images/list
 * List all generated module images
 */
router.get('/list', async (req, res) => {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const outputDir = path.join(process.cwd(), 'attached_assets', 'module_backgrounds');
    
    try {
      const files = await fs.readdir(outputDir);
      const images = files
        .filter(f => f.endsWith('.png'))
        .map(f => ({
          filename: f,
          url: `/attached_assets/module_backgrounds/${f}`,
          moduleId: f.split('_')[0]
        }));
      
      res.json({
        success: true,
        count: images.length,
        images
      });
    } catch (error) {
      // Directory doesn't exist yet
      res.json({
        success: true,
        count: 0,
        images: []
      });
    }

  } catch (error) {
    console.error('Error listing images:', error);
    res.status(500).json({ 
      error: 'Failed to list images',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
