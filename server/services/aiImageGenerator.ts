/**
 * AI Image Generator Service
 * Generates custom backgrounds for each Disaster Direct module using OpenAI DALL-E
 * with text watermarks embedded
 */

import OpenAI from 'openai';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface ModuleImageRequest {
  moduleId: string;
  title: string;
  description: string;
  prompt: string;
}

export interface GeneratedImage {
  moduleId: string;
  imageUrl: string;
  localPath: string;
  timestamp: Date;
}

/**
 * Generate AI image for a module using DALL-E
 */
export async function generateModuleImage(request: ModuleImageRequest): Promise<GeneratedImage> {
  console.log(`🎨 Generating AI image for module: ${request.moduleId}`);
  
  try {
    // Generate image with DALL-E
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: request.prompt,
      n: 1,
      size: '1792x1024', // Wide format for hero banners
      quality: 'hd',
      style: 'vivid'
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error('No image URL returned from DALL-E');
    }

    console.log(`✅ Generated base image for ${request.moduleId}`);

    // Download the image
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Add watermark with title and description
    const watermarkedBuffer = await addWatermark(imageBuffer, request.title, request.description);

    // Save to local file system
    const outputDir = path.join(process.cwd(), 'attached_assets', 'module_backgrounds');
    await fs.mkdir(outputDir, { recursive: true });
    
    const filename = `${request.moduleId}_${Date.now()}.png`;
    const localPath = path.join(outputDir, filename);
    
    await fs.writeFile(localPath, watermarkedBuffer);

    console.log(`💾 Saved watermarked image: ${localPath}`);

    return {
      moduleId: request.moduleId,
      imageUrl: imageUrl,
      localPath: `/attached_assets/module_backgrounds/${filename}`,
      timestamp: new Date()
    };

  } catch (error) {
    console.error(`❌ Error generating image for ${request.moduleId}:`, error);
    throw error;
  }
}

/**
 * Add text watermark to image with title and description
 */
async function addWatermark(
  imageBuffer: Buffer,
  title: string,
  description: string
): Promise<Buffer> {
  try {
    // Create SVG overlay with title and description
    const svgOverlay = `
      <svg width="1792" height="1024">
        <defs>
          <linearGradient id="textGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:rgba(0,0,0,0.7);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgba(0,0,0,0.3);stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Dark overlay at bottom for text readability -->
        <rect x="0" y="700" width="1792" height="324" fill="url(#textGradient)" />
        
        <!-- Title -->
        <text 
          x="60" 
          y="850" 
          font-family="Inter, Arial, sans-serif" 
          font-size="72" 
          font-weight="800" 
          fill="white" 
          style="text-shadow: 0 4px 12px rgba(0,0,0,0.8), 0 8px 24px rgba(0,0,0,0.6);"
        >${escapeXml(title)}</text>
        
        <!-- Description -->
        <text 
          x="60" 
          y="920" 
          font-family="Inter, Arial, sans-serif" 
          font-size="32" 
          font-weight="400" 
          fill="rgba(255,255,255,0.9)" 
          style="text-shadow: 0 2px 8px rgba(0,0,0,0.7);"
        >${escapeXml(description)}</text>
        
        <!-- Disaster Direct branding -->
        <text 
          x="60" 
          y="980" 
          font-family="Inter, Arial, sans-serif" 
          font-size="20" 
          font-weight="600" 
          fill="rgba(255,255,255,0.6)" 
          style="text-shadow: 0 2px 4px rgba(0,0,0,0.6);"
        >DISASTER DIRECT</text>
      </svg>
    `;

    // Composite the watermark onto the image
    const watermarkedImage = await sharp(imageBuffer)
      .composite([
        {
          input: Buffer.from(svgOverlay),
          top: 0,
          left: 0
        }
      ])
      .png()
      .toBuffer();

    return watermarkedImage;

  } catch (error) {
    console.error('❌ Error adding watermark:', error);
    // Return original image if watermarking fails
    return imageBuffer;
  }
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate images for all modules
 */
export async function generateAllModuleImages(modules: ModuleImageRequest[]): Promise<GeneratedImage[]> {
  console.log(`🎨 Starting batch generation for ${modules.length} modules`);
  
  const results: GeneratedImage[] = [];
  
  // Generate images sequentially to avoid rate limits
  for (const module of modules) {
    try {
      const result = await generateModuleImage(module);
      results.push(result);
      
      // Small delay between requests to be nice to the API
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Failed to generate image for ${module.moduleId}:`, error);
      // Continue with other modules even if one fails
    }
  }
  
  console.log(`✅ Generated ${results.length}/${modules.length} module images`);
  return results;
}

export default {
  generateModuleImage,
  generateAllModuleImages
};
