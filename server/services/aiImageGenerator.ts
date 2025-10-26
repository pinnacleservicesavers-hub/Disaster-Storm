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
    // Generate image with DALL-E (Replit AI Integrations)
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: request.prompt,
      n: 1,
      size: '1536x1024', // Landscape format for hero banners (max supported by Replit AI)
      quality: 'high' // Replit AI uses 'high' instead of 'hd'
    });

    const imageData = response.data[0];
    if (!imageData) {
      throw new Error('No image data returned from DALL-E');
    }

    console.log(`✅ Generated base image for ${request.moduleId}`);

    // Get image buffer (handle both URL and base64 responses)
    let imageBuffer: Buffer;
    if (imageData.url) {
      // Download from URL
      const imageResponse = await fetch(imageData.url);
      imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    } else if (imageData.b64_json) {
      // Decode base64
      imageBuffer = Buffer.from(imageData.b64_json, 'base64');
    } else {
      throw new Error('No image URL or base64 data in response');
    }
    
    const originalUrl = imageData.url || 'base64-encoded';

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
      imageUrl: originalUrl,
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
    // Get image dimensions
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 1536;
    const height = metadata.height || 1024;
    
    // Calculate responsive dimensions
    const textAreaHeight = Math.floor(height * 0.32); // 32% of height for text area
    const textStartY = height - textAreaHeight;
    const titleY = Math.floor(height * 0.83); // 83% down for title
    const descY = Math.floor(height * 0.90); // 90% down for description
    const brandingY = Math.floor(height * 0.96); // 96% down for branding
    
    // Font sizes scaled to image width
    const titleSize = Math.floor(width * 0.047); // ~72px for 1536px width
    const descSize = Math.floor(width * 0.021); // ~32px for 1536px width
    const brandSize = Math.floor(width * 0.013); // ~20px for 1536px width
    const padding = Math.floor(width * 0.039); // ~60px for 1536px width
    
    // Create SVG overlay with title and description
    const svgOverlay = `
      <svg width="${width}" height="${height}">
        <defs>
          <linearGradient id="textGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:rgba(0,0,0,0.7);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgba(0,0,0,0.3);stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Dark overlay at bottom for text readability -->
        <rect x="0" y="${textStartY}" width="${width}" height="${textAreaHeight}" fill="url(#textGradient)" />
        
        <!-- Title -->
        <text 
          x="${padding}" 
          y="${titleY}" 
          font-family="Inter, Arial, sans-serif" 
          font-size="${titleSize}" 
          font-weight="800" 
          fill="white" 
          style="text-shadow: 0 4px 12px rgba(0,0,0,0.8), 0 8px 24px rgba(0,0,0,0.6);"
        >${escapeXml(title)}</text>
        
        <!-- Description -->
        <text 
          x="${padding}" 
          y="${descY}" 
          font-family="Inter, Arial, sans-serif" 
          font-size="${descSize}" 
          font-weight="400" 
          fill="rgba(255,255,255,0.9)" 
          style="text-shadow: 0 2px 8px rgba(0,0,0,0.7);"
        >${escapeXml(description)}</text>
        
        <!-- Disaster Direct branding -->
        <text 
          x="${padding}" 
          y="${brandingY}" 
          font-family="Inter, Arial, sans-serif" 
          font-size="${brandSize}" 
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
      
      // Longer delay between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error: any) {
      console.error(`❌ Failed to generate image for ${module.moduleId}:`, error?.message || error);
      
      // If rate limited, wait longer before continuing
      if (error?.status === 429) {
        console.log('⏸️  Rate limited - waiting 30 seconds before continuing...');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
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
