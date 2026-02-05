/**
 * Activate Selected Models
 * Sets 5 models per category as 'active', rest as 'hidden'
 */

import { eq, inArray } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { aiModelsSchema } from '@/models/Schema';

// Selected 5 best models for each category (using actual model IDs from database)
const SELECTED_MODELS: Record<string, string[]> = {
  // Text generation - Google Gemini models (all 5 best ones)
  text_to_text: [
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
  ],

  // Text-to-Image generation - Best quality diverse options
  text_to_image: [
    'flux-1.1-pro-ultra', // Best quality Flux
    'flux-schnell', // Fast & cheap
    'imagen3', // Google's Imagen 3
    'flux-kontext-max-t2i', // Best context-aware
    'seedream-4.5-t2i', // ByteDance best
  ],

  // Image-to-Image - Editing and transformation
  image_to_image: [
    'flux-kontext-max-multi', // Best quality multi-image context
    'flux-kontext-pro', // Good quality context editing
    'flux-redux-pro', // Image variations with prompt
    'flux-2-pro-edit', // Best editing
    'flux-kontext-dev', // Dev tier context
  ],

  // Image-to-Video - Animation (best quality options)
  image_to_video: [
    'sora-2-i2v-pro', // OpenAI Sora 2 Pro - best quality
    'veo3.1-i2v', // Google Veo 3.1
    'kling-2.6-pro-i2v', // Kling 2.6 Pro
    'hailuo-2.3-pro-i2v', // Hailuo 2.3 Pro
    'luma-ray-2-i2v', // Luma Ray 2
  ],

  // Music generation - Suno (all 5)
  music_generation: [
    'V5', // Latest
    'V4_5PLUS', // V4.5 Plus
    'V4_5ALL', // V4.5 All
    'V4_5', // V4.5
    'V4', // V4
  ],

  // Transcription - Deepgram (all 4)
  transcription: [
    'nova-2', // Best quality
    'nova', // Good quality
    'enhanced', // Enhanced
    'base', // Base
  ],
};

async function activateSelectedModels() {
  console.log('🔄 Activating selected models...\n');

  // First, set ALL models to 'hidden'
  console.log('📦 Setting all models to hidden...');
  await db
    .update(aiModelsSchema)
    .set({ status: 'hidden', updatedAt: new Date() });

  // Then activate selected models for each category
  for (const [category, modelIds] of Object.entries(SELECTED_MODELS)) {
    console.log(`\n✅ Activating ${category}:`);

    for (const modelId of modelIds) {
      const result = await db
        .update(aiModelsSchema)
        .set({ status: 'active', updatedAt: new Date() })
        .where(eq(aiModelsSchema.modelId, modelId))
        .returning();

      if (result.length > 0) {
        console.log(`   ✓ ${modelId}`);
      } else {
        console.log(`   ✗ ${modelId} (not found)`);
      }
    }
  }

  // Print summary
  console.log('\n📊 Summary:');
  const allModels = await db.select().from(aiModelsSchema);
  const activeCount = allModels.filter(m => m.status === 'active').length;
  const hiddenCount = allModels.filter(m => m.status === 'hidden').length;

  console.log(`   Active: ${activeCount}`);
  console.log(`   Hidden: ${hiddenCount}`);
  console.log(`   Total: ${allModels.length}`);

  // Show active by category
  console.log('\n📂 Active by category:');
  const categories: Record<string, number> = {};
  for (const model of allModels.filter(m => m.status === 'active')) {
    categories[model.category] = (categories[model.category] || 0) + 1;
  }
  for (const [cat, count] of Object.entries(categories).sort()) {
    console.log(`   ${cat}: ${count}`);
  }

  process.exit(0);
}

activateSelectedModels().catch((error) => {
  console.error('❌ Failed:', error);
  process.exit(1);
});
