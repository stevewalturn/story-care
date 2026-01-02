/**
 * Test script for Atlas Cloud models
 * Run with: npx tsx scripts/test-atlas-cloud-models.ts
 *
 * This script tests all Atlas Cloud image models to verify:
 * 1. Correct API endpoint and parameters
 * 2. Minimum size requirements
 * 3. Required fields (image vs images)
 */

import 'dotenv/config';

// Model configuration with their specific requirements
const ATLAS_MODELS = {
  // Text-to-Image models (no reference image required)
  'text-to-image': {
    'flux-schnell': {
      atlasName: 'black-forest-labs/flux-schnell',
      minSize: '1024*1024',
      defaultSteps: 4,
      requiresImage: false,
      imageField: null,
    },
    'flux-dev': {
      atlasName: 'black-forest-labs/flux-dev',
      minSize: '1024*1024',
      defaultSteps: 28,
      requiresImage: false,
      imageField: null,
    },
  },

  // Image-to-Image models (reference image required)
  'image-editing': {
    'flux-redux-dev': {
      atlasName: 'black-forest-labs/flux-redux-dev',
      minSize: '1024*1024',
      defaultSteps: 28,
      requiresImage: true,
      imageField: 'image', // singular
    },
    // Seedream models - require larger images
    'seedream-4.5-edit': {
      atlasName: 'bytedance/seedream-v4.5/edit',
      minSize: '1920*1920', // 3,686,400 pixels minimum
      defaultSteps: 28,
      requiresImage: true,
      imageField: 'images', // array
    },
    'seedream-4.5-edit-seq': {
      atlasName: 'bytedance/seedream-v4.5/edit-sequential',
      minSize: '1920*1920',
      defaultSteps: 28,
      requiresImage: true,
      imageField: 'images',
    },
    'seedream-4-edit': {
      atlasName: 'bytedance/seedream-v4/edit',
      minSize: '1920*1920',
      defaultSteps: 28,
      requiresImage: true,
      imageField: 'images',
    },
    'seedream-4-edit-seq': {
      atlasName: 'bytedance/seedream-v4/edit-sequential',
      minSize: '1920*1920',
      defaultSteps: 28,
      requiresImage: true,
      imageField: 'images',
    },
    // Nano Banana models
    'nano-banana-pro-edit-ultra': {
      atlasName: 'google/nano-banana-pro/edit-ultra',
      minSize: '1024*1024',
      defaultSteps: 28,
      requiresImage: true,
      imageField: 'images',
    },
    'nano-banana-pro-edit': {
      atlasName: 'google/nano-banana-pro/edit',
      minSize: '1024*1024',
      defaultSteps: 28,
      requiresImage: true,
      imageField: 'images',
    },
    'nano-banana-pro-edit-dev': {
      atlasName: 'google/nano-banana-pro/edit-dev',
      minSize: '1024*1024',
      defaultSteps: 28,
      requiresImage: true,
      imageField: 'images',
    },
    'nano-banana-edit-dev': {
      atlasName: 'google/nano-banana/edit-dev',
      minSize: '1024*1024',
      defaultSteps: 28,
      requiresImage: true,
      imageField: 'images',
    },
    'nano-banana-edit': {
      atlasName: 'google/nano-banana/edit',
      minSize: '1024*1024',
      defaultSteps: 28,
      requiresImage: true,
      imageField: 'images',
    },
    // Qwen/Wan models
    'qwen-image-edit': {
      atlasName: 'alibaba/qwen/image-edit',
      minSize: '1024*1024',
      defaultSteps: 28,
      requiresImage: true,
      imageField: 'images',
    },
    'qwen-image-edit-plus': {
      atlasName: 'alibaba/qwen/image-edit-plus',
      minSize: '1024*1024',
      defaultSteps: 28,
      requiresImage: true,
      imageField: 'images',
    },
    'wan-2.6-i2i': {
      atlasName: 'alibaba/wan-2.6/image-edit',
      minSize: '1024*1024',
      defaultSteps: 28,
      requiresImage: true,
      imageField: 'images',
    },
    'wan-2.5-edit': {
      atlasName: 'alibaba/wan-2.5/image-edit',
      minSize: '1024*1024',
      defaultSteps: 28,
      requiresImage: true,
      imageField: 'images',
    },
  },

  // Upscaling models
  'upscaling': {
    'recraft-crisp-upscale': {
      atlasName: 'recraft/crisp-upscale',
      minSize: '1024*1024',
      defaultSteps: 28,
      requiresImage: true,
      imageField: 'image',
    },
  },

  // Style Transfer models
  'style-transfer': {
    'plastic-bubble-figure': {
      atlasName: 'style/plastic-bubble-figure',
      minSize: '1024*1024',
      defaultSteps: 28,
      requiresImage: true,
      imageField: 'images',
    },
    'my-world': {
      atlasName: 'style/my-world',
      minSize: '1024*1024',
      defaultSteps: 28,
      requiresImage: true,
      imageField: 'images',
    },
    'micro-landscape-mini-world': {
      atlasName: 'style/micro-landscape-mini-world',
      minSize: '1024*1024',
      defaultSteps: 28,
      requiresImage: true,
      imageField: 'images',
    },
  },
};

// Export flattened model config for use in AtlasCloud.ts
export type ModelConfig = {
  atlasName: string;
  minSize: string;
  defaultSteps: number;
  requiresImage: boolean;
  imageField: 'image' | 'images' | null;
};

export const MODEL_CONFIGS: Record<string, ModelConfig> = {};
for (const category of Object.values(ATLAS_MODELS)) {
  for (const [modelId, config] of Object.entries(category)) {
    MODEL_CONFIGS[modelId] = config as ModelConfig;
  }
}

// Test image URL (public test image)
const TEST_IMAGE_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/300px-PNG_transparency_demonstration_1.png';

async function testModel(
  modelId: string,
  config: ModelConfig,
  dryRun: boolean = true,
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.ATLASCLOUD_API_KEY;

  if (!apiKey) {
    return { success: false, error: 'ATLASCLOUD_API_KEY not configured' };
  }

  // Build request body
  const requestBody: Record<string, unknown> = {
    model: config.atlasName,
    prompt: 'A simple test image of a red apple on a white background',
    seed: 42,
    size: config.minSize,
    num_images: 1,
    output_format: 'jpeg',
    guidance_scale: 3.5,
    num_inference_steps: config.defaultSteps,
    enable_sync_mode: false,
    enable_base64_output: false,
    enable_safety_checker: true,
  };

  // Add image field if required
  if (config.requiresImage) {
    if (config.imageField === 'image') {
      requestBody.image = TEST_IMAGE_URL;
    } else if (config.imageField === 'images') {
      requestBody.images = [TEST_IMAGE_URL];
    }
  }

  console.log(`\n[${modelId}] Testing with config:`);
  console.log(`  Atlas Name: ${config.atlasName}`);
  console.log(`  Min Size: ${config.minSize}`);
  console.log(`  Requires Image: ${config.requiresImage}`);
  console.log(`  Image Field: ${config.imageField || 'none'}`);

  if (dryRun) {
    console.log(`  [DRY RUN] Would send:`, JSON.stringify(requestBody, null, 2));
    return { success: true };
  }

  try {
    const response = await fetch(
      'https://api.atlascloud.ai/api/v1/model/generateImage',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      },
    );

    const result = await response.json();

    if (!response.ok || result.code !== 200) {
      const errorMsg = result.msg || result.error?.message || response.statusText;
      console.log(`  [FAILED] ${errorMsg}`);
      return { success: false, error: errorMsg };
    }

    console.log(`  [SUCCESS] Prediction ID: ${result.data?.id}`);
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.log(`  [ERROR] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Atlas Cloud Model Test Script');
  console.log('='.repeat(60));

  const args = process.argv.slice(2);
  const dryRun = !args.includes('--live');
  const specificModel = args.find(a => !a.startsWith('--'));

  if (dryRun) {
    console.log('\n[MODE] Dry run - showing request payloads only');
    console.log('       Use --live to make actual API calls\n');
  } else {
    console.log('\n[MODE] Live - making actual API calls\n');
  }

  const results: Record<string, { success: boolean; error?: string }> = {};

  for (const [category, models] of Object.entries(ATLAS_MODELS)) {
    console.log(`\n${'='.repeat(40)}`);
    console.log(`Category: ${category}`);
    console.log('='.repeat(40));

    for (const [modelId, config] of Object.entries(models)) {
      if (specificModel && modelId !== specificModel) {
        continue;
      }

      results[modelId] = await testModel(modelId, config as ModelConfig, dryRun);

      // Small delay between calls if live
      if (!dryRun) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('SUMMARY');
  console.log('='.repeat(60));

  const successful = Object.entries(results).filter(([, r]) => r.success);
  const failed = Object.entries(results).filter(([, r]) => !r.success);

  console.log(`\nSuccessful: ${successful.length}`);
  for (const [modelId] of successful) {
    console.log(`  - ${modelId}`);
  }

  if (failed.length > 0) {
    console.log(`\nFailed: ${failed.length}`);
    for (const [modelId, result] of failed) {
      console.log(`  - ${modelId}: ${result.error}`);
    }
  }

  // Export configuration for use in code
  console.log(`\n${'='.repeat(60)}`);
  console.log('MODEL CONFIGURATION EXPORT');
  console.log('='.repeat(60));
  console.log('\nCopy this configuration to AtlasCloud.ts:\n');
  console.log(`const MODEL_CONFIGS: Record<string, ModelConfig> = ${JSON.stringify(MODEL_CONFIGS, null, 2)};`);
}

main().catch(console.error);
