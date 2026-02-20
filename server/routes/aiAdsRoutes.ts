import type { Express, Request, Response } from "express";
import { aiAdsAssistant } from "../services/aiAdsAssistant";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export function registerAIAdsRoutes(app: Express) {
  
  // Generate AI ad copy
  app.post('/api/ai-ads/generate-copy', async (req: Request, res: Response) => {
    try {
      const { businessType, targetAudience, urgency, serviceType, location, stormType, budget, platform } = req.body;
      
      const variations = await aiAdsAssistant.generateAdCopy({
        businessType,
        targetAudience,
        urgency,
        serviceType,
        location,
        stormType,
        budget,
        platform
      });
      
      res.json({ success: true, variations });
    } catch (error) {
      console.error('Error generating ad copy:', error);
      res.status(500).json({ error: 'Failed to generate ad copy', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Generate AI ad creative/image
  app.post('/api/ai-ads/generate-creative', async (req: Request, res: Response) => {
    try {
      const { adCopy, visualStyle, damageType, emotion } = req.body;
      
      const imageUrl = await aiAdsAssistant.generateAdCreative({
        adCopy,
        visualStyle,
        damageType,
        emotion
      });
      
      res.json({ success: true, imageUrl });
    } catch (error) {
      console.error('Error generating ad creative:', error);
      res.status(500).json({ error: 'Failed to generate ad creative', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Get AI ad strategy recommendations
  app.post('/api/ai-ads/strategy', async (req: Request, res: Response) => {
    try {
      const { stormData, demographics, budget, platforms } = req.body;
      
      const strategy = await aiAdsAssistant.getAdStrategy({
        stormData,
        demographics,
        budget,
        platforms
      });
      
      res.json({ success: true, strategy });
    } catch (error) {
      console.error('Error generating ad strategy:', error);
      res.status(500).json({ error: 'Failed to generate ad strategy', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Get Facebook Ads setup guide
  app.post('/api/ai-ads/facebook-guide', async (req: Request, res: Response) => {
    try {
      const businessInfo = req.body;
      
      const guide = await aiAdsAssistant.getFacebookAdSetupGuide(businessInfo);
      
      res.json({ success: true, guide });
    } catch (error) {
      console.error('Error generating Facebook guide:', error);
      res.status(500).json({ error: 'Failed to generate Facebook guide', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Optimize campaign with AI
  app.post('/api/ai-ads/optimize', async (req: Request, res: Response) => {
    try {
      const campaignData = req.body;
      
      const optimization = await aiAdsAssistant.optimizeCampaign(campaignData);
      
      res.json({ success: true, optimization });
    } catch (error) {
      console.error('Error optimizing campaign:', error);
      res.status(500).json({ error: 'Failed to optimize campaign', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // AI chat assistant
  app.post('/api/ai-ads/chat', async (req: Request, res: Response) => {
    try {
      const { message, context } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      
      const response = await aiAdsAssistant.chatAssistant(message, context);
      
      res.json({ success: true, response });
    } catch (error) {
      console.error('Error in AI chat:', error);
      res.status(500).json({ error: 'Failed to process chat', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Generate headlines
  app.post('/api/ai-ads/headlines', async (req: Request, res: Response) => {
    try {
      const { topic, count = 5 } = req.body;
      
      if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
      }
      
      const headlines = await aiAdsAssistant.generateHeadlines(topic, count);
      
      res.json({ success: true, headlines });
    } catch (error) {
      console.error('Error generating headlines:', error);
      res.status(500).json({ error: 'Failed to generate headlines', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  app.post('/api/ai-ads/freeform-create', async (req: Request, res: Response) => {
    try {
      const { prompt, adType, style, platform, includeImage } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required - tell us what ad you want to create' });
      }
      
      const result = await aiAdsAssistant.createFreeformAd({
        prompt,
        adType: adType || 'image',
        style,
        platform,
        includeImage: includeImage !== false
      });
      
      res.json({ success: true, result });
    } catch (error) {
      console.error('Error creating freeform ad:', error);
      res.status(500).json({ error: 'Failed to create ad', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/api/ai-ads/generate-image-only', async (req: Request, res: Response) => {
    try {
      const { prompt, style } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Image prompt is required' });
      }
      
      const imageUrl = await aiAdsAssistant.generateImageOnly(prompt, style);
      
      res.json({ success: true, imageUrl });
    } catch (error) {
      console.error('Error generating image:', error);
      res.status(500).json({ error: 'Failed to generate image', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/api/ai-ads/generate-brochure', async (req: Request, res: Response) => {
    try {
      const { prompt, format, paperSize } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Describe your business and brochure needs' });
      }
      const validFormats = ['tri-fold', 'bi-fold', 'single-page'];
      const validSizes = ['letter', 'legal', 'a4', 'tabloid', 'a3', 'a5'];
      const safeFormat = validFormats.includes(format) ? format : 'tri-fold';
      const safePaperSize = validSizes.includes(paperSize) ? paperSize : 'letter';

      const brochure = await aiAdsAssistant.generateBrochure(prompt, safeFormat, safePaperSize);
      res.json({ success: true, brochure });
    } catch (error) {
      console.error('Error generating brochure:', error);
      res.status(500).json({ error: 'Failed to generate brochure', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/api/ai-ads/brochure-pdf', async (req: Request, res: Response) => {
    const tmpFile = path.join(os.tmpdir(), `brochure-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`);
    let childProcess: ReturnType<typeof spawn> | null = null;

    const cleanup = () => {
      try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch {}
    };

    try {
      const { brochureData, format: reqFormat, paperSize: reqPaperSize } = req.body;
      const hasNewFormat = brochureData?.outsidePanels && brochureData?.insidePanels;
      const hasOldFormat = brochureData?.panels && Array.isArray(brochureData.panels);
      if (!brochureData || (!hasNewFormat && !hasOldFormat)) {
        return res.status(400).json({ error: 'Valid brochure data with panels is required' });
      }
      const totalPanels = hasNewFormat
        ? (brochureData.outsidePanels.length + brochureData.insidePanels.length)
        : brochureData.panels.length;
      if (totalPanels > 12) {
        return res.status(400).json({ error: 'Maximum 12 panels allowed' });
      }

      const validFormats = ['tri-fold', 'bi-fold', 'single-page'];
      const validSizes = ['letter', 'legal', 'a4', 'tabloid', 'a3', 'a5'];
      const safeFormat = validFormats.includes(reqFormat) ? reqFormat : 'tri-fold';
      const safePaperSize = validSizes.includes(reqPaperSize) ? reqPaperSize : 'letter';

      const inputJson = JSON.stringify({ ...brochureData, _format: safeFormat, _paperSize: safePaperSize });
      if (inputJson.length > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'Brochure data too large' });
      }

      const scriptPath = path.join(process.cwd(), 'server', 'scripts', 'generate-brochure-pdf.py');

      childProcess = spawn('python3', [scriptPath, tmpFile], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stderr = '';
      childProcess.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
      childProcess.stdin.write(inputJson);
      childProcess.stdin.end();

      const timeout = 45000;
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          childProcess?.kill('SIGKILL');
          reject(new Error('PDF generation timed out'));
        }, timeout);

        childProcess!.on('close', (code) => {
          clearTimeout(timer);
          if (code === 0) resolve();
          else reject(new Error(`PDF generation failed (code ${code}): ${stderr.slice(0, 500)}`));
        });
        childProcess!.on('error', (err) => {
          clearTimeout(timer);
          reject(err);
        });
      });

      if (!fs.existsSync(tmpFile)) {
        return res.status(500).json({ error: 'PDF file was not created' });
      }

      const pdfBuffer = fs.readFileSync(tmpFile);
      cleanup();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="brochure-${Date.now()}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error) {
      cleanup();
      console.error('PDF generation error:', error);
      res.status(500).json({ error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/api/ai-ads/sound-design', async (req: Request, res: Response) => {
    try {
      const { prompt, type, voiceStyle, duration, industry, backgroundMusic } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Describe what you want to create' });
      }
      
      const result = await aiAdsAssistant.createSoundDesign({
        prompt,
        type: type || 'voice_ad',
        voiceStyle,
        duration,
        industry,
        backgroundMusic
      });
      
      res.json({ success: true, result });
    } catch (error) {
      console.error('Error creating sound design:', error);
      res.status(500).json({ error: 'Failed to create sound design', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/api/ai-ads/generate-voiceover', async (req: Request, res: Response) => {
    try {
      const { text, voiceStyle } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Text is required for voice generation' });
      }
      
      const result = await aiAdsAssistant.generateVoiceOver(text, voiceStyle);
      
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Error generating voiceover:', error);
      res.status(500).json({ error: 'Failed to generate voiceover', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/api/ai-ads/proxy-image', async (req: Request, res: Response) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ error: 'url parameter required' });

      const allowedHosts = ['oaidalleapiprodscus.blob.core.windows.net', 'dalleprodsec.blob.core.windows.net', 'images.openai.com'];
      const parsed = new URL(url);
      if (!allowedHosts.some(h => parsed.hostname.endsWith(h))) {
        return res.status(403).json({ error: 'Image host not allowed' });
      }

      const imgResp = await fetch(url);
      if (!imgResp.ok) throw new Error(`Upstream ${imgResp.status}`);

      const contentType = imgResp.headers.get('content-type') || 'image/png';
      const buffer = Buffer.from(await imgResp.arrayBuffer());

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(buffer);
    } catch (error) {
      console.error('Image proxy error:', error);
      res.status(500).json({ error: 'Failed to proxy image' });
    }
  });

  app.post('/api/ai-ads/generate-script', async (req: Request, res: Response) => {
    try {
      const { industry, style, input } = req.body;
      
      const systemPrompt = `You are a world-class ad copywriter for contractors. Generate a complete ad script for a ${industry} business in a ${style} style. Return JSON with: hook (attention-grabbing opener), offer (the deal/discount), body (2-3 sentences of persuasive copy), cta (call to action), hashtags (array of 8-10 relevant hashtags), captions (array of objects with platform and text for TikTok, Facebook, Instagram), voiceSuggestion (voice tone recommendation), musicSuggestion (music style recommendation). Be creative, punchy, and industry-specific.`;

      try {
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI();
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: input || `Create a ${style} ad for ${industry}` }
          ],
          response_format: { type: 'json_object' },
          max_tokens: 1000,
        });
        
        const scriptData = JSON.parse(completion.choices[0]?.message?.content || '{}');
        res.json({ success: true, script: scriptData });
      } catch (aiError) {
        const industryHooks: Record<string, string[]> = {
          'tree-service': ['This tree could cost you thousands', 'Storm season is here', 'Don\'t wait until it falls'],
          'roofing': ['Your roof is leaking money', 'One storm away from disaster', 'FREE roof inspection'],
          'house-cleaning': ['Your house deserves better', 'Life\'s too short to clean', 'We clean so you don\'t have to'],
          'pressure-washing': ['You won\'t believe this is the same driveway', 'Satisfying clean coming up', 'Your neighbors will be jealous'],
          'plumbing': ['That drip is costing you $50/month', 'Emergency plumber on call 24/7', 'Small leak? Big problem coming'],
          'hvac': ['Your AC is about to die', 'Save $200/month on energy', 'Don\'t sweat it — literally'],
        };
        const hooks = industryHooks[industry] || ['Professional service you can trust', 'Licensed and insured', 'Call today'];
        
        res.json({ success: true, script: {
          hook: hooks[Math.floor(Math.random() * hooks.length)],
          offer: `Special offer for ${industry.replace(/-/g, ' ')} — call for details!`,
          body: `Professional ${industry.replace(/-/g, ' ')} services you can trust. Licensed, insured, and ready to serve.`,
          cta: 'Call today for a FREE estimate!',
          hashtags: [`#${industry.replace(/-/g, '')}`, '#contractor', '#professional', '#licensed', '#insured', '#freeestimate', '#localservice', '#homeimprovement'],
          captions: [
            { platform: 'TikTok', text: `${hooks[0]} Call now! #${industry.replace(/-/g, '')} #fyp` },
            { platform: 'Facebook', text: `${hooks[0]}\n\nLicensed & Insured. Call for a free estimate today!` },
            { platform: 'Instagram', text: `${hooks[0]} \u2728\n\nDM us for a free estimate!\n\n#${industry.replace(/-/g, '')} #contractor #professional` },
          ],
          voiceSuggestion: style === 'funny-meme' ? 'High energy, comedic timing' : style === 'luxury' ? 'Calm, sophisticated' : 'Confident, professional',
          musicSuggestion: style === 'aggressive' ? 'Hard beat drop, epic trailer' : style === 'luxury' ? 'Cinematic orchestra' : 'Upbeat commercial instrumental',
        }});
      }
    } catch (error) {
      console.error('Error generating script:', error);
      res.status(500).json({ error: 'Failed to generate script', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/api/ai-ads/search-memes', async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) return res.status(400).json({ error: 'Query parameter q is required' });

      let results: any[] = [];
      try {
        const tenorRes = await fetch(`https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&limit=12&media_filter=tinygif,gif`);
        const tenorData = await tenorRes.json();
        results = (tenorData.results || []).map((r: any) => ({
          id: r.id,
          title: r.title || query,
          preview: r.media_formats?.tinygif?.url || '',
          full: r.media_formats?.gif?.url || '',
          source: 'tenor'
        }));
      } catch {
        try {
          const giphyRes = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(query)}&limit=12&rating=g`);
          const giphyData = await giphyRes.json();
          results = (giphyData.data || []).map((g: any) => ({
            id: g.id,
            title: g.title || query,
            preview: g.images?.fixed_height_small?.url || g.images?.fixed_height?.url || '',
            full: g.images?.original?.url || '',
            source: 'giphy'
          }));
        } catch {
          results = [];
        }
      }

      res.json({ success: true, results });
    } catch (error) {
      console.error('Meme search error:', error);
      res.status(500).json({ error: 'Failed to search memes' });
    }
  });

  console.log('🎨 AI Ads Assistant routes registered (all industries, sound studio enabled)');
}
