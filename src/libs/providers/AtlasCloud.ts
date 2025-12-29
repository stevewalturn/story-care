/**
 * Atlas Cloud AI Generation Provider
 * Supports: Flux image models and video generation
 * Documentation: https://docs.atlascloud.ai/
 */

export type AtlasImageModel =
  // Text-to-Image
  | 'flux-schnell'
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

  // Map model to Atlas format
  const modelNames: Record<AtlasImageModel, string> = {
    // Text-to-Image
    'flux-schnell': 'black-forest-labs/flux-schnell',
    'flux-dev': 'black-forest-labs/flux-dev',
    // Image-to-Image (existing)
    'flux-redux-dev': 'black-forest-labs/flux-redux-dev',
    // Image-to-Image (Alibaba/Qwen)
    'wan-2.6-i2i': 'alibaba/wan-2.6/image-edit',
    'wan-2.5-edit': 'alibaba/wan-2.5/image-edit',
    'qwen-image-edit': 'alibaba/qwen/image-edit',
    'qwen-image-edit-plus': 'alibaba/qwen/image-edit-plus',
    // Image-to-Image (ByteDance/Seedream)
    'seedream-4.5-edit': 'bytedance/seedream-v4.5/edit',
    'seedream-4.5-edit-seq': 'bytedance/seedream-v4.5/edit-sequential',
    'seedream-4-edit': 'bytedance/seedream-v4/edit',
    'seedream-4-edit-seq': 'bytedance/seedream-v4/edit-sequential',
    // Image-to-Image (Google/Nano Banana)
    'nano-banana-pro-edit-ultra': 'google/nano-banana-pro/edit-ultra',
    'nano-banana-pro-edit': 'google/nano-banana-pro/edit',
    'nano-banana-pro-edit-dev': 'google/nano-banana-pro/edit-dev',
    'nano-banana-edit-dev': 'google/nano-banana/edit-dev',
    'nano-banana-edit': 'google/nano-banana/edit',
    // Upscaling
    'recraft-crisp-upscale': 'recraft/crisp-upscale',
    // Style Transfer
    'plastic-bubble-figure': 'style/plastic-bubble-figure',
    'my-world': 'style/my-world',
    'micro-landscape-mini-world': 'style/micro-landscape-mini-world',
  };

  const atlasModel = modelNames[model];

  // Build request body
  const requestBody: any = {
    model: atlasModel,
    prompt: options.prompt,
    seed: options.seed ?? 0,
    size: options.size || '1024*1024',
    num_images: options.numImages || 1,
    output_format: 'jpeg',
    guidance_scale: options.guidanceScale ?? 3.5,
    num_inference_steps: options.numInferenceSteps ?? (model === 'flux-schnell' ? 4 : 28),
    enable_sync_mode: false,
    enable_base64_output: false,
    enable_safety_checker: options.enableSafetyChecker ?? true,
  };

  // Add reference images based on model type
  if (options.referenceImages && options.referenceImages.length > 0) {
    if (model === 'flux-redux-dev') {
      // Flux Redux uses singular 'image' parameter (only first image)
      requestBody.image = options.referenceImages[0];
    } else {
      // Other I2I models (Seedream, Nano Banana, Qwen, Wan, etc.) use 'images' array
      // These models support multiple reference images
      requestBody.images = options.referenceImages;
    }
  }

  // Step 1: Start image generation
  console.log('[AtlasCloud] Starting image generation with request:', {
    url: 'https://api.atlascloud.ai/api/v1/model/generateImage',
    model: atlasModel,
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

  // Map model to Atlas format
  const modelNames: Record<AtlasVideoModel, string> = {
    'seedance-1-lite': 'bytedance/seedance-1-lite',
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
