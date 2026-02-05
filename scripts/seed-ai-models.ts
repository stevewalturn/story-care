/**
 * Seed AI Models
 * Populates ai_models table from ModelMetadata.ts and ModelPricing.ts
 */

import type { ModelCategory, PricingUnit } from '@/models/Schema';
import { eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import {
  getAtlasCloudImageModelId,
  getAtlasCloudVideoModelId,
  IMAGE_GENERATION_MODELS,
  TEXT_GENERATION_MODELS,
  VIDEO_GENERATION_MODELS,
} from '@/libs/ModelMetadata';
import {
  IMAGE_MODEL_PRICING,
  MUSIC_MODEL_PRICING,
  TRANSCRIPTION_MODEL_PRICING,
  VIDEO_MODEL_PRICING,
} from '@/libs/ModelPricing';
import { aiModelsSchema, usersSchema } from '@/models/Schema';

// Extract provider from group name
function extractProvider(providerGroup: string): string {
  const groupLower = providerGroup.toLowerCase();

  if (groupLower.includes('flux')) return 'Black Forest Labs';
  if (groupLower.includes('seedream') || groupLower.includes('bytedance')) return 'ByteDance';
  if (groupLower.includes('imagen') || groupLower.includes('nano banana') || groupLower.includes('gemini')) return 'Google';
  if (groupLower.includes('ideogram')) return 'Ideogram';
  if (groupLower.includes('recraft')) return 'Recraft';
  if (groupLower.includes('wan') || groupLower.includes('alibaba') || groupLower.includes('qwen')) return 'Alibaba';
  if (groupLower.includes('luma') || groupLower.includes('photon')) return 'Luma';
  if (groupLower.includes('atlascloud') || groupLower.includes('hunyuan') || groupLower.includes('hidream')) return 'AtlasCloud';
  if (groupLower.includes('z-image')) return 'Z-Image';
  if (groupLower.includes('sora') || groupLower.includes('openai')) return 'OpenAI';
  if (groupLower.includes('veo') || groupLower.includes('google')) return 'Google';
  if (groupLower.includes('kling') || groupLower.includes('kwai')) return 'Kuaishou';
  if (groupLower.includes('hailuo') || groupLower.includes('minimax')) return 'MiniMax';
  if (groupLower.includes('vidu')) return 'Vidu';
  if (groupLower.includes('pika')) return 'Pika';
  if (groupLower.includes('pixverse')) return 'PixVerse';
  if (groupLower.includes('magi')) return 'AtlasCloud';
  if (groupLower.includes('ltx') || groupLower.includes('lightricks')) return 'Lightricks';
  if (groupLower.includes('deepgram')) return 'Deepgram';
  if (groupLower.includes('suno')) return 'Suno';

  // Extract from parentheses if present
  const match = providerGroup.match(/\(([^)]+)\)/);
  if (match) return match[1];

  return providerGroup.split(' ')[0];
}

async function seedAiModels() {
  console.log('🌱 Seeding AI models...\n');

  // Get or create the system user
  const existingUsers = await db
    .select()
    .from(usersSchema)
    .where(eq(usersSchema.email, 'system@storycare.health'))
    .limit(1);

  let systemUser = existingUsers[0];

  if (!systemUser) {
    console.log('⚙️  Creating system user...');
    const newUsers = await db
      .insert(usersSchema)
      .values({
        email: 'system@storycare.health',
        name: 'System',
        role: 'super_admin',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    systemUser = Array.isArray(newUsers) ? newUsers[0] : null;
    console.log('✅ System user created');
  }

  if (!systemUser) {
    console.error('❌ Failed to create or find system user');
    process.exit(1);
  }

  const modelsToInsert: Array<{
    modelId: string;
    displayName: string;
    description: string | null;
    category: ModelCategory;
    provider: string;
    providerGroup: string;
    status: 'active' | 'hidden' | 'deprecated' | 'disabled';
    sortOrder: number;
    costPerUnit: string | null;
    pricingUnit: PricingUnit | null;
    capabilities: Record<string, unknown>;
    apiModelId: string | null;
    apiProvider: string | null;
  }> = [];

  let sortOrder = 0;

  // ============================================================================
  // TEXT GENERATION MODELS (Google Gemini)
  // ============================================================================
  console.log('📝 Processing text generation models...');

  for (const [groupName, models] of Object.entries(TEXT_GENERATION_MODELS)) {
    for (const model of models) {
      modelsToInsert.push({
        modelId: model.value,
        displayName: model.label,
        description: null,
        category: 'text_to_text',
        provider: 'Google',
        providerGroup: groupName,
        status: 'active',
        sortOrder: sortOrder++,
        costPerUnit: null, // Langfuse auto-tracks these
        pricingUnit: 'per_1k_tokens',
        capabilities: {},
        apiModelId: model.value,
        apiProvider: 'google',
      });
    }
  }

  console.log(`   Added ${sortOrder} text generation models`);

  // ============================================================================
  // IMAGE GENERATION MODELS
  // ============================================================================
  console.log('🖼️  Processing image generation models...');

  const imageModelCount = sortOrder;

  for (const [groupName, models] of Object.entries(IMAGE_GENERATION_MODELS)) {
    // Determine category based on group name
    let category: ModelCategory = 'text_to_image';

    const groupLower = groupName.toLowerCase();
    if (
      groupLower.includes('kontext')
      || groupLower.includes('edit')
      || groupLower.includes('upscal')
      || groupLower.includes('style transfer')
      || groupLower.includes('utilities')
      || groupLower.includes('special')
      || (groupLower.includes('lora') && !groupLower.includes('text-to-image'))
    ) {
      // These groups are image-to-image (editing models)
      if (
        groupLower.includes('kontext')
        || groupLower.includes('edit')
        || groupLower.includes('upscal')
        || groupLower.includes('style transfer')
        || groupLower.includes('utilities')
        || groupLower.includes('special')
      ) {
        category = 'image_to_image';
      }
    }

    // Special handling for groups that are clearly image editing
    if (
      groupName === 'Flux Kontext (Single Image)'
      || groupName === 'Flux Kontext (Multi Image)'
      || groupName === 'Flux 2 Edit'
      || groupName === 'Flux Special'
      || groupName === 'Seedream (ByteDance)'
      || groupName === 'Nano Banana (Google)'
      || groupName === 'Alibaba/Qwen'
      || groupName === 'Luma Photon'
      || groupName === 'AtlasCloud Special'
      || groupName === 'Upscaling'
      || groupName === 'Utilities'
      || groupName === 'Style Transfer'
      || groupName === 'Google Gemini'
    ) {
      category = 'image_to_image';
    }

    for (const model of models) {
      const pricing = IMAGE_MODEL_PRICING[model.value];

      modelsToInsert.push({
        modelId: model.value,
        displayName: model.label,
        description: null,
        category,
        provider: extractProvider(groupName),
        providerGroup: groupName,
        status: 'active',
        sortOrder: sortOrder++,
        costPerUnit: pricing ? pricing.toFixed(6) : null,
        pricingUnit: 'per_image',
        capabilities: {
          supportsReference: (model as any).supportsReference || false,
          maxReferenceImages: (model as any).maxReferenceImages || 0,
          supportsPrompt: (model as any).supportsPrompt ?? true,
        },
        apiModelId: getAtlasCloudImageModelId(model.value),
        apiProvider: 'atlascloud',
      });
    }
  }

  console.log(`   Added ${sortOrder - imageModelCount} image generation models`);

  // ============================================================================
  // VIDEO GENERATION MODELS
  // ============================================================================
  console.log('🎬 Processing video generation models...');

  const videoModelCount = sortOrder;

  for (const [groupName, models] of Object.entries(VIDEO_GENERATION_MODELS)) {
    for (const model of models) {
      const pricing = VIDEO_MODEL_PRICING[model.value];

      modelsToInsert.push({
        modelId: model.value,
        displayName: model.label,
        description: (model as any).description || null,
        category: 'image_to_video',
        provider: extractProvider(groupName),
        providerGroup: groupName,
        status: 'active',
        sortOrder: sortOrder++,
        costPerUnit: pricing ? pricing.toFixed(6) : null,
        pricingUnit: 'per_second',
        capabilities: {},
        apiModelId: getAtlasCloudVideoModelId(model.value),
        apiProvider: 'atlascloud',
      });
    }
  }

  console.log(`   Added ${sortOrder - videoModelCount} video generation models`);

  // ============================================================================
  // MUSIC GENERATION MODELS (Suno)
  // ============================================================================
  console.log('🎵 Processing music generation models...');

  const musicModelCount = sortOrder;

  const musicModels = [
    { value: 'V4', label: 'Suno V4' },
    { value: 'V4_5', label: 'Suno V4.5' },
    { value: 'V4_5PLUS', label: 'Suno V4.5 Plus' },
    { value: 'V4_5ALL', label: 'Suno V4.5 All' },
    { value: 'V5', label: 'Suno V5' },
  ];

  for (const model of musicModels) {
    const pricing = MUSIC_MODEL_PRICING[model.value];

    modelsToInsert.push({
      modelId: model.value,
      displayName: model.label,
      description: null,
      category: 'music_generation',
      provider: 'Suno',
      providerGroup: 'Suno',
      status: 'active',
      sortOrder: sortOrder++,
      costPerUnit: pricing ? pricing.toFixed(6) : null,
      pricingUnit: 'per_minute',
      capabilities: {},
      apiModelId: model.value,
      apiProvider: 'suno',
    });
  }

  console.log(`   Added ${sortOrder - musicModelCount} music generation models`);

  // ============================================================================
  // TRANSCRIPTION MODELS (Deepgram)
  // ============================================================================
  console.log('🎤 Processing transcription models...');

  const transcriptionModelCount = sortOrder;

  const transcriptionModels = [
    { value: 'nova-2', label: 'Deepgram Nova 2 (Best)' },
    { value: 'nova', label: 'Deepgram Nova' },
    { value: 'enhanced', label: 'Deepgram Enhanced' },
    { value: 'base', label: 'Deepgram Base' },
  ];

  for (const model of transcriptionModels) {
    const pricing = TRANSCRIPTION_MODEL_PRICING[model.value];

    modelsToInsert.push({
      modelId: model.value,
      displayName: model.label,
      description: null,
      category: 'transcription',
      provider: 'Deepgram',
      providerGroup: 'Deepgram',
      status: 'active',
      sortOrder: sortOrder++,
      costPerUnit: pricing ? pricing.toFixed(6) : null,
      pricingUnit: 'per_minute',
      capabilities: {},
      apiModelId: model.value,
      apiProvider: 'deepgram',
    });
  }

  console.log(`   Added ${sortOrder - transcriptionModelCount} transcription models`);

  // ============================================================================
  // INSERT OR UPDATE MODELS
  // ============================================================================
  console.log('\n💾 Inserting models into database...');

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const model of modelsToInsert) {
    try {
      // Check if model exists
      const existing = await db
        .select()
        .from(aiModelsSchema)
        .where(eq(aiModelsSchema.modelId, model.modelId))
        .limit(1);

      if (existing.length > 0) {
        // Update existing (but preserve status)
        await db
          .update(aiModelsSchema)
          .set({
            displayName: model.displayName,
            description: model.description,
            category: model.category,
            provider: model.provider,
            providerGroup: model.providerGroup,
            sortOrder: model.sortOrder,
            costPerUnit: model.costPerUnit,
            pricingUnit: model.pricingUnit,
            capabilities: model.capabilities,
            apiModelId: model.apiModelId,
            apiProvider: model.apiProvider,
            updatedAt: new Date(),
          })
          .where(eq(aiModelsSchema.modelId, model.modelId));
        updated++;
      } else {
        // Insert new
        await db.insert(aiModelsSchema).values({
          ...model,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        inserted++;
      }
    } catch (error) {
      console.error(`   ❌ Error with model ${model.modelId}:`, error);
      errors++;
    }
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`   📥 Inserted: ${inserted}`);
  console.log(`   🔄 Updated: ${updated}`);
  if (errors > 0) {
    console.log(`   ❌ Errors: ${errors}`);
  }
  console.log(`   📊 Total models: ${modelsToInsert.length}`);

  // Print category breakdown
  console.log('\n📊 Category breakdown:');
  const categoryBreakdown: Record<string, number> = {};
  for (const model of modelsToInsert) {
    categoryBreakdown[model.category] = (categoryBreakdown[model.category] || 0) + 1;
  }
  for (const [cat, count] of Object.entries(categoryBreakdown).sort()) {
    console.log(`   ${cat}: ${count}`);
  }

  process.exit(0);
}

seedAiModels().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
