/**
 * Test: Generate a single AI image
 * Run with: npx tsx server/scripts/testSingleImage.ts
 */

import { generateModuleImage, type ModuleImageRequest } from '../services/aiImageGenerator';
import { MODULE_THEMES } from '../../shared/moduleThemes';

async function main() {
  console.log('🎨 Testing Single AI Image Generation');
  console.log('=' .repeat(60));
  
  // Test with Weather module
  const weatherTheme = MODULE_THEMES.weather;
  
  const request: ModuleImageRequest = {
    moduleId: weatherTheme.id,
    title: weatherTheme.title,
    description: weatherTheme.description,
    prompt: weatherTheme.dallePrompt
  };

  console.log(`\n📋 Generating: ${request.title}`);
  console.log(`📝 Prompt: ${request.prompt.substring(0, 100)}...`);
  console.log('');
  
  try {
    const result = await generateModuleImage(request);
    
    console.log('');
    console.log('✅ SUCCESS!');
    console.log(`📁 Saved to: ${result.localPath}`);
    console.log(`🌐 Original URL: ${result.imageUrl}`);
    console.log('');
    
  } catch (error: any) {
    console.error('');
    console.error('❌ FAILED:', error?.message || error);
    console.error('');
    if (error?.error) {
      console.error('Error details:', JSON.stringify(error.error, null, 2));
    }
    process.exit(1);
  }
}

main();
