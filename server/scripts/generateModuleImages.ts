/**
 * CLI Script: Generate AI Images for All Modules
 * Run with: npx tsx server/scripts/generateModuleImages.ts
 */

import { generateAllModuleImages, type ModuleImageRequest } from '../services/aiImageGenerator';
import { MODULE_THEMES } from '../../shared/moduleThemes';

async function main() {
  console.log('🎨 Disaster Direct - AI Module Image Generator');
  console.log('=' .repeat(60));
  console.log('');
  
  const modules: ModuleImageRequest[] = Object.values(MODULE_THEMES).map(theme => ({
    moduleId: theme.id,
    title: theme.title,
    description: theme.description,
    prompt: theme.dallePrompt
  }));

  console.log(`📋 Preparing to generate ${modules.length} module backgrounds:`);
  modules.forEach((m, i) => {
    console.log(`   ${i + 1}. ${m.title}`);
  });
  console.log('');
  console.log('⚙️  Using OpenAI DALL-E via Replit AI Integrations');
  console.log('💰 Cost: Billed to your Replit credits');
  console.log('');
  
  const startTime = Date.now();
  
  try {
    const results = await generateAllModuleImages(modules);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('');
    console.log('=' .repeat(60));
    console.log(`✅ SUCCESS: Generated ${results.length}/${modules.length} images`);
    console.log(`⏱️  Total time: ${duration}s`);
    console.log('');
    console.log('📁 Images saved to: attached_assets/module_backgrounds/');
    console.log('');
    
    results.forEach(result => {
      console.log(`   ✓ ${result.moduleId}: ${result.localPath}`);
    });
    
    if (results.length < modules.length) {
      const failed = modules.length - results.length;
      console.log('');
      console.log(`⚠️  Warning: ${failed} image(s) failed to generate`);
    }
    
  } catch (error) {
    console.error('');
    console.error('❌ FAILED:', error);
    process.exit(1);
  }
}

main();
