/**
 * Atlas Cloud AI Generation Provider
 * Supports: Flux image models and video generation
 * Documentation: https://docs.atlascloud.ai/
 */

export type AtlasImageModel
  // Text-to-Image
  = | 'flux-schnell'
    | 'flux-dev'
  // Image-to-Image (existing)
    | 'flux-redux-dev'
  // Image-to-Image (Alibaba/Qwen)
    | 'wan-2.6-i2i'
    | 'wan-2.5-edit'
    | 'qwen-image-edit'
    | 'qwen-image-edit-plus'
  // Image-to-Image (ByteDance/Seedream)
    | 'seedream-4.5-edit'
    | 'seedream-4.5-edit-seq'
    | 'seedream-4-edit'
    | 'seedream-4-edit-seq'
  // Image-to-Image (Google/Nano Banana)
    | 'nano-banana-pro-edit-ultra'
    | 'nano-banana-pro-edit'
    | 'nano-banana-pro-edit-dev'
    | 'nano-banana-edit-dev'
    | 'nano-banana-edit'
  // Upscaling
    | 'recraft-crisp-upscale'
  // Style Transfer
    | 'plastic-bubble-figure'
    | 'my-world'
    | 'micro-landscape-mini-world';

export type AtlasVideoModel = 'seedance-1-lite';

/**
 * Model configuration with specific requirements
 */
type ModelConfig = {
  atlasName: string;
  minSize: string;
  defaultSteps: number;
  requiresImage: boolean;
  imageField: 'image' | 'images' | null;
  category: 'text-to-image' | 'image-editing' | 'upscaling' | 'style-transfer';
};

/**
 * Per-model configuration for Atlas Cloud
 * Defines size requirements, image field names, and other model-specific settings
 */
const MODEL_CONFIGS: Record<AtlasImageModel, ModelConfig> = {
  // Text-to-Image models (no reference image required)
  'flux-schnell': {
    atlasName: 'black-forest-labs/flux-schnell',
    minSize: '1024*1024',
    defaultSteps: 4,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
  },
  'flux-dev': {
    atlasName: 'black-forest-labs/flux-dev',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
  },

  // Flux Redux (singular 'image' field)
  'flux-redux-dev': {
    atlasName: 'black-forest-labs/flux-redux-dev',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image',
    category: 'image-editing',
  },

  // Seedream models - require larger images (1920x1920 = 3,686,400 pixels)
  'seedream-4.5-edit': {
    atlasName: 'bytedance/seedream-v4.5/edit',
    minSize: '1920*1920',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'image-editing',
  },
  'seedream-4.5-edit-seq': {
    atlasName: 'bytedance/seedream-v4.5/edit-sequential',
    minSize: '1920*1920',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'image-editing',
  },
  'seedream-4-edit': {
    atlasName: 'bytedance/seedream-v4/edit',
    minSize: '1920*1920',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'image-editing',
  },
  'seedream-4-edit-seq': {
    atlasName: 'bytedance/seedream-v4/edit-sequential',
    minSize: '1920*1920',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'image-editing',
  },

  // Nano Banana models
  'nano-banana-pro-edit-ultra': {
    atlasName: 'google/nano-banana-pro/edit-ultra',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'image-editing',
  },
  'nano-banana-pro-edit': {
    atlasName: 'google/nano-banana-pro/edit',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'image-editing',
  },
  'nano-banana-pro-edit-dev': {
    atlasName: 'google/nano-banana-pro/edit-dev',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'image-editing',
  },
  'nano-banana-edit-dev': {
    atlasName: 'google/nano-banana/edit-dev',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'image-editing',
  },
  'nano-banana-edit': {
    atlasName: 'google/nano-banana/edit',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'image-editing',
  },

  // Qwen/Wan models
  'qwen-image-edit': {
    atlasName: 'alibaba/qwen/image-edit',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'image-editing',
  },
  'qwen-image-edit-plus': {
    atlasName: 'alibaba/qwen/image-edit-plus',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'image-editing',
  },
  'wan-2.6-i2i': {
    atlasName: 'alibaba/wan-2.6/image-edit',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'image-editing',
  },
  'wan-2.5-edit': {
    atlasName: 'alibaba/wan-2.5/image-edit',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'image-editing',
  },

  // Upscaling
  'recraft-crisp-upscale': {
    atlasName: 'recraft/crisp-upscale',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image',
    category: 'upscaling',
  },

  // Style Transfer
  'plastic-bubble-figure': {
    atlasName: 'style/plastic-bubble-figure',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'style-transfer',
  },
  'my-world': {
    atlasName: 'style/my-world',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'style-transfer',
  },
  'micro-landscape-mini-world': {
    atlasName: 'style/micro-landscape-mini-world',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'style-transfer',
  },
};

export type AtlasImageGenerateOptions = {
  prompt: string;
  model?: AtlasImageModel;
  seed?: number;
  size?: string; // e.g., "1024*1024"
  numImages?: number;
  guidanceScale?: number;
  numInferenceSteps?: number;
  enableSafetyChecker?: boolean;
  referenceImages?: string[]; // Array of URLs or base64 - for image-to-image generation
};

export type AtlasVideoGenerateOptions = {
  prompt: string;
  model?: AtlasVideoModel;
  referenceImage?: string; // URL or base64
  duration?: number; // seconds
  fps?: number;
  seed?: number;
};

type AtlasPredictionResponse = {
  code: number;
  msg: string;
  data: {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    outputs?: string[]; // Array of URLs
    error?: string;
  };
};

/**
 * Parse Atlas Cloud error messages into user-friendly text
 */
export function parseAtlasError(error: string): string {
  // Size requirement errors
  if (error.includes('image size must be at least')) {
    const match = error.match(/at least (\d+) pixels/);
    const pixels = match?.[1] ? Number.parseInt(match[1], 10) : 0;
    const side = Math.sqrt(pixels);
    return `This model requires a minimum image size of ${side}x${side} pixels. Please use a larger reference image or choose a different model.`;
  }

  // Missing image field
  if (error.includes('property "image" is missing') || error.includes('property "images" is missing')) {
    return 'This model requires a reference image. Please provide a patient reference image or portrait.';
  }

  // Invalid model
  if (error.includes('model not found') || error.includes('invalid model')) {
    return 'The selected AI model is not available. Please choose a different model.';
  }

  // Rate limiting
  if (error.includes('rate limit') || error.includes('too many requests')) {
    return 'Too many image generation requests. Please wait a moment and try again.';
  }

  // Content policy
  if (error.includes('content policy') || error.includes('safety')) {
    return 'The prompt was rejected due to content policy. Please modify your prompt and try again.';
  }

  // Timeout
  if (error.includes('timeout') || error.includes('timed out')) {
    return 'Image generation timed out. Please try again with a simpler prompt.';
  }

  // Generic error - return original message cleaned up
  return error.replace(/Request id: \S+/g, '').trim() || 'Image generation failed. Please try again.';
}

/**
 * Generate image with Atlas Cloud
 */
export async function generateImageWithAtlas(
  options: AtlasImageGenerateOptions,
): Promise<{ imageUrl: string; model: string }> {
  const apiKey = process.env.ATLASCLOUD_API_KEY;

  if (!apiKey) {
    throw new Error('ATLASCLOUD_API_KEY is not configured');
  }

  const model = options.model || 'flux-schnell';
  const modelConfig = MODEL_CONFIGS[model];

  if (!modelConfig) {
    throw new Error(`Unknown model: ${model}. Please select a valid Atlas Cloud model.`);
  }

  // Validate: Image-editing models require reference images
  if (modelConfig.requiresImage && (!options.referenceImages || options.referenceImages.length === 0)) {
    throw new Error(`Model "${model}" requires a reference image. Please provide a patient reference image or portrait.`);
  }

  // Use model-specific size (unless explicitly overridden)
  const size = options.size || modelConfig.minSize;

  // Build request body
  const requestBody: Record<string, unknown> = {
    model: modelConfig.atlasName,
    prompt: options.prompt,
    seed: options.seed ?? 0,
    size,
    num_images: options.numImages || 1,
    output_format: 'jpeg',
    guidance_scale: options.guidanceScale ?? 3.5,
    num_inference_steps: options.numInferenceSteps ?? modelConfig.defaultSteps,
    enable_sync_mode: false,
    enable_base64_output: false,
    enable_safety_checker: options.enableSafetyChecker ?? true,
  };

  // Add reference images using the correct field name for this model
  if (options.referenceImages && options.referenceImages.length > 0 && modelConfig.imageField) {
    if (modelConfig.imageField === 'image') {
      // Models that use singular 'image' field (flux-redux-dev, recraft-crisp-upscale)
      requestBody.image = options.referenceImages[0];
    } else if (modelConfig.imageField === 'images') {
      // Models that use 'images' array (Seedream, Nano Banana, Qwen, Wan, style)
      requestBody.images = options.referenceImages;
    }
  }

  // Step 1: Start image generation
  console.log('[AtlasCloud] Starting image generation with request:', {
    url: 'https://api.atlascloud.ai/api/v1/model/generateImage',
    model: modelConfig.atlasName,
    prompt: options.prompt.substring(0, 100) + (options.prompt.length > 100 ? '...' : ''),
    size: requestBody.size,
    numImages: requestBody.num_images,
    referenceImageCount: options.referenceImages?.length || 0,
    requestBody,
  });

  const generateResponse = await fetch(
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

  console.log('[AtlasCloud] Response status:', generateResponse.status, generateResponse.statusText);

  if (!generateResponse.ok) {
    const error = await generateResponse.json().catch(() => ({ msg: 'Unknown error' }));
    console.error('[AtlasCloud] Error response:', {
      status: generateResponse.status,
      statusText: generateResponse.statusText,
      error,
      headers: Object.fromEntries(generateResponse.headers.entries()),
    });
    throw new Error(`Atlas Cloud error: ${error.msg || generateResponse.statusText}`);
  }

  const generateResult: AtlasPredictionResponse = await generateResponse.json();

  console.log('[AtlasCloud] Generate result:', {
    code: generateResult.code,
    msg: generateResult.msg,
    predictionId: generateResult.data?.id,
    status: generateResult.data?.status,
  });

  if (generateResult.code !== 200) {
    console.error('[AtlasCloud] Non-200 code in response:', generateResult);
    throw new Error(`Atlas Cloud error: ${generateResult.msg}`);
  }

  const predictionId = generateResult.data.id;

  console.log('[AtlasCloud] Polling for result with prediction ID:', predictionId);

  // Step 2: Poll for result
  const imageUrl = await pollAtlasStatus(predictionId, apiKey, 'image');

  console.log('[AtlasCloud] Image generation successful:', imageUrl);

  return {
    imageUrl,
    model,
  };
}

/**
 * Generate video with Atlas Cloud
 */
export async function generateVideoWithAtlas(
  options: AtlasVideoGenerateOptions,
): Promise<{ videoUrl: string; model: string }> {
  const apiKey = process.env.ATLASCLOUD_API_KEY;

  if (!apiKey) {
    throw new Error('ATLASCLOUD_API_KEY is not configured');
  }

  const model = options.model || 'seedance-1-lite';

  // Map model to Atlas format (must include /image-to-video suffix)
  const modelNames: Record<AtlasVideoModel, string> = {
    'seedance-1-lite': 'bytedance/seedance-1-lite/image-to-video',
  };

  const atlasModel = modelNames[model];

  // Step 1: Start video generation
  const generateResponse = await fetch(
    'https://api.atlascloud.ai/api/v1/model/generateVideo',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: atlasModel,
        prompt: options.prompt,
        reference_image: options.referenceImage || '',
        duration: options.duration || 5,
        fps: options.fps || 24,
        seed: options.seed ?? -1,
      }),
    },
  );

  if (!generateResponse.ok) {
    const error = await generateResponse.json().catch(() => ({ msg: 'Unknown error' }));
    throw new Error(`Atlas Cloud error: ${error.msg || generateResponse.statusText}`);
  }

  const generateResult: AtlasPredictionResponse = await generateResponse.json();

  if (generateResult.code !== 200) {
    throw new Error(`Atlas Cloud error: ${generateResult.msg}`);
  }

  const predictionId = generateResult.data.id;

  // Step 2: Poll for result
  const videoUrl = await pollAtlasStatus(predictionId, apiKey, 'video');

  return {
    videoUrl,
    model,
  };
}

/**
 * Poll Atlas Cloud for prediction status
 */
async function pollAtlasStatus(
  predictionId: string,
  apiKey: string,
  type: 'image' | 'video',
): Promise<string> {
  const maxAttempts = 60; // 2 minutes max (2s intervals)
  let attempts = 0;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    attempts++;

    const response = await fetch(
      `https://api.atlascloud.ai/api/v1/model/prediction/${predictionId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to check status: ${response.statusText}`);
    }

    const result: AtlasPredictionResponse = await response.json();

    if (result.code !== 200) {
      throw new Error(`Atlas Cloud error: ${result.msg}`);
    }

    if (result.data.status === 'completed') {
      if (!result.data.outputs || result.data.outputs.length === 0) {
        throw new Error(`No ${type} generated`);
      }
      const output = result.data.outputs[0];
      if (!output) {
        throw new Error(`Invalid ${type} output`);
      }
      return output;
    }

    if (result.data.status === 'failed') {
      throw new Error(result.data.error || `${type} generation failed`);
    }

    // Still processing, continue polling
  }

  throw new Error(`${type} generation timed out after ${maxAttempts * 2} seconds`);
}

/**
 * Get available Atlas Cloud image models
 */
export function getAtlasImageModels(): Array<{
  id: AtlasImageModel;
  name: string;
  description: string;
  pricing: string;
  supportsImageToImage: boolean;
  category: 'text-to-image' | 'image-editing' | 'upscaling' | 'style-transfer';
}> {
  return [
    // Text-to-Image
    {
      id: 'flux-schnell',
      name: 'Flux Schnell',
      description: 'Fastest image generation (4 steps) - 12B parameter model',
      pricing: '$0.0024/image',
      supportsImageToImage: false,
      category: 'text-to-image',
    },
    {
      id: 'flux-dev',
      name: 'Flux Dev',
      description: 'High quality image generation (28 steps) - 12B parameter model',
      pricing: '$0.0096/image',
      supportsImageToImage: false,
      category: 'text-to-image',
    },
    // Image Editing
    {
      id: 'flux-redux-dev',
      name: 'Flux Redux Dev',
      description: 'Image-to-image generation with reference image support',
      pricing: '$0.0096/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'seedream-4.5-edit',
      name: 'Seedream v4.5 Edit',
      description: 'Preserves facial features, lighting, color tones (Best Quality)',
      pricing: '$0.04/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'seedream-4.5-edit-seq',
      name: 'Seedream v4.5 Sequential',
      description: 'Batch editing with feature preservation',
      pricing: '$0.04/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'seedream-4-edit',
      name: 'Seedream v4 Edit',
      description: 'Advanced image editing',
      pricing: '$0.027/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'seedream-4-edit-seq',
      name: 'Seedream v4 Sequential',
      description: 'Batch editing support',
      pricing: '$0.027/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'nano-banana-pro-edit-ultra',
      name: 'Nano Banana Pro Ultra',
      description: 'Premium AI-powered adjustments',
      pricing: '$0.15/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'nano-banana-pro-edit',
      name: 'Nano Banana Pro Edit',
      description: 'Precise AI-powered visual adjustments',
      pricing: '$0.119/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'nano-banana-pro-edit-dev',
      name: 'Nano Banana Pro Dev',
      description: 'Developer version',
      pricing: '$0.07/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'nano-banana-edit',
      name: 'Nano Banana Edit',
      description: 'Google state-of-the-art editing',
      pricing: '$0.038/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'nano-banana-edit-dev',
      name: 'Nano Banana Edit Dev',
      description: 'Cheapest editing option',
      pricing: '$0.019/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'qwen-image-edit',
      name: 'Qwen Image Edit',
      description: '20B MMDiT model for image editing',
      pricing: '$0.02/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'qwen-image-edit-plus',
      name: 'Qwen Image Edit Plus',
      description: 'Enhanced 20B MMDiT model',
      pricing: '$0.02/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'wan-2.6-i2i',
      name: 'Wan-2.6 Image Edit',
      description: 'Supports image editing and mixed text/image output',
      pricing: '$0.0225/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'wan-2.5-edit',
      name: 'Wan-2.5 Image Edit',
      description: 'Large-scale image generative',
      pricing: '$0.035/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    // Upscaling
    {
      id: 'recraft-crisp-upscale',
      name: 'Recraft Crisp Upscale',
      description: 'Image upscaling',
      pricing: '$0.004/image',
      supportsImageToImage: true,
      category: 'upscaling',
    },
    // Style Transfer
    {
      id: 'plastic-bubble-figure',
      name: 'Plastic Bubble Figure',
      description: 'Artistic style transfer',
      pricing: '$0.02/image',
      supportsImageToImage: true,
      category: 'style-transfer',
    },
    {
      id: 'my-world',
      name: 'My World',
      description: 'Artistic style transfer',
      pricing: '$0.02/image',
      supportsImageToImage: true,
      category: 'style-transfer',
    },
    {
      id: 'micro-landscape-mini-world',
      name: 'Micro Landscape Mini World',
      description: 'Miniature world style transfer',
      pricing: '$0.02/image',
      supportsImageToImage: true,
      category: 'style-transfer',
    },
  ];
}

/**
 * Get available Atlas Cloud video models
 */
export function getAtlasVideoModels(): Array<{
  id: AtlasVideoModel;
  name: string;
  description: string;
}> {
  return [
    {
      id: 'seedance-1-lite',
      name: 'SeeDance 1 Lite',
      description: 'Fast video generation from text or image prompts',
    },
  ];
}
