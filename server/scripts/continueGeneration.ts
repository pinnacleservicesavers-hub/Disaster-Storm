/**
 * Continue generating remaining module images
 */

import { generateModuleImage, type ModuleImageRequest } from '../services/aiImageGenerator';
import { MODULE_THEMES } from '../../shared/moduleThemes';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  console.log('🎨 Continuing Module Image Generation');
  console.log('=' .repeat(60));
  
  // Check which modules already have images
  const outputDir = path.join(process.cwd(), 'attached_assets', 'module_backgrounds');
  const existingFiles = await fs.readdir(outputDir);
  const completedModules = new Set(
    existingFiles.map(f => f.split('_')[0])
  );
  
  // Get modules that need generation
  const allModules: ModuleImageRequest[] = Object.values(MODULE_THEMES).map(theme => ({
    moduleId: theme.id,
    title: theme.title,
    description: theme.description,
    prompt: theme.dallePrompt
  }));
  
  const remainingModules = allModules.filter(m => !completedModules.has(m.moduleId));
  
  console.log(`\n✅ Completed: ${completedModules.size} modules`);
  console.log(`⏳ Remaining: ${remainingModules.length} modules\n`);
  
  if (remainingModules.length === 0) {
    console.log('🎉 All modules already have images!');
    return;
  }
  
  console.log('Remaining modules:');
  remainingModules.forEach((m, i) => {
    console.log(`   ${i + 1}. ${m.title}`);
  });
  console.log('');
  
  const startTime = Date.now();
  const results = [];
  
  for (const module of remainingModules) {
    try {
      const result = await generateModuleImage(module);
      results.push(result);
      console.log(`✓ ${module.title} completed\n`);
      
      // Wait 5 seconds between requests
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error: any) {
      console.error(`❌ Failed to generate ${module.title}:`, error?.message);
      
      if (error?.status === 429) {
        console.log('⏸️  Rate limited - waiting 30 seconds...\n');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log('');
  console.log('=' .repeat(60));
  console.log(`✅ Generated ${results.length}/${remainingModules.length} additional images`);
  console.log(`⏱️  Time: ${duration}s`);
  console.log(`📊 Total complete: ${completedModules.size + results.length}/17`);
}

main();
