/**
 * Unified Image Generation Service
 * Consolidates all image generation providers into a single interface
 */

import type { AtlasImageModel } from './providers/AtlasCloud';
import type { FalModel } from './providers/FalAI';
import type { GeminiImageModel } from './providers/GeminiImage';
import type { StabilityModel } from './providers/StabilityAI';

// All available models
export type ImageGenModel
  = | StabilityModel
    | FalModel
    | AtlasImageModel
    | GeminiImageModel;

export type ImageGenerationOptions = {
  prompt: string;
  model: ImageGenModel;
  negativePrompt?: string;
  width?: number;
  height?: number;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  seed?: number;
  quality?: 'standard' | 'hd';
  style?: 'natural' | 'vivid';
  referenceImages?: string[]; // Array of Base64 or URLs for image-to-image (supports multiple)
};

export type ImageGenerationResult = {
  imageUrl: string;
  model: string;
};

/**
 * Generate an image using the specified model
 */
export async function generateImage(
  options: ImageGenerationOptions,
): Promise<ImageGenerationResult> {
  const { model, prompt } = options;

  console.log('[ImageGeneration] Generating image with options:', {
    model,
    promptLength: prompt.length,
    width: options.width,
    height: options.height,
    aspectRatio: options.aspectRatio,
    referenceImageCount: options.referenceImages?.length || 0,
    style: options.style,
    quality: options.quality,
  });

  // Route to Google Gemini (Image-to-Image) - only supports single reference image
  if (model === 'gemini-2.5-flash-image') {
    const { generateImageWithGemini } = await import('./providers/GeminiImage');
    return await generateImageWithGemini({
      prompt,
      model,
      referenceImage: options.referenceImages?.[0], // Gemini only supports single image
    });
  }

  // Route to Stability AI
  if (
    model === 'sd3.5-large'
    || model === 'sd3.5-medium'
    || model === 'sd3-large'
    || model === 'sdxl-1.0'
  ) {
    const { generateImageWithStability } = await import('./providers/StabilityAI');
    return await generateImageWithStability({
      prompt,
      model: model as StabilityModel,
      negativePrompt: options.negativePrompt,
      aspectRatio: options.aspectRatio,
      seed: options.seed,
    });
  }

  // Route to Atlas Cloud (All image models from AtlasCloud.ts)
  const atlasCloudModels = [
    // Text-to-Image (Flux)
    'flux-schnell',
    'flux-dev',
    'flux-2-flex-t2i',
    'flux-1.1-pro-ultra',
    'flux-1.1-pro',
    'flux-kontext-max-t2i',
    'flux-kontext-pro-t2i',
    'flux-dev-ultra-fast',
    'flux-dev-lora',
    'flux-dev-lora-ultra-fast',
    'flux-schnell-lora',
    'flux-krea-dev-lora-t2i',
    // Text-to-Image (Seedream)
    'seedream-4.5-t2i',
    'seedream-4.5-seq-t2i',
    'seedream-4-t2i',
    'seedream-4-seq-t2i',
    'seedream-3.1-t2i',
    'seedream-3-t2i',
    // Text-to-Image (Imagen)
    'imagen4-ultra',
    'imagen4',
    'imagen4-fast',
    'atlascloud-imagen4',
    'imagen3',
    'imagen3-fast',
    // Text-to-Image (Nano Banana/Gemini)
    'nano-banana-pro-t2i-ultra',
    'nano-banana-pro-t2i',
    'nano-banana-pro-t2i-dev',
    'nano-banana-t2i',
    'nano-banana-t2i-dev',
    'gemini-2.5-flash-t2i',
    'gemini-2.5-flash-t2i-dev',
    // Text-to-Image (Ideogram)
    'ideogram-v3-quality',
    'ideogram-v3-balanced',
    'ideogram-v3-turbo',
    'ideogram-v2',
    'ideogram-v2-turbo',
    'ideogram-v2a-turbo',
    // Text-to-Image (Recraft)
    'recraft-v3',
    'recraft-v3-svg',
    'recraft-20b',
    'recraft-20b-svg',
    // Text-to-Image (Wan)
    'wan-2.6-t2i',
    'wan-2.5-t2i',
    'wan-2.1-t2i',
    // Text-to-Image (Luma)
    'photon-t2i',
    'photon-flash-t2i',
    // Text-to-Image (AtlasCloud)
    'hunyuan-image-3',
    'neta-lumina',
    'qwen-t2i',
    'hidream-i1-full',
    'hidream-i1-dev',
    // Text-to-Image (Z-Image)
    'z-image-turbo',
    'z-image-turbo-lora',
    // Flux Redux
    'flux-redux-dev',
    'flux-redux-pro',
    // Flux 2 Edit
    'flux-2-dev-edit',
    'flux-2-pro-edit',
    'flux-2-flex-edit',
    // Flux Kontext (Single Image)
    'flux-kontext-max',
    'flux-kontext-pro',
    'flux-kontext-dev',
    'flux-kontext-dev-ultra-fast',
    'flux-kontext-dev-lora',
    'flux-kontext-dev-lora-ultra-fast',
    // Flux Kontext (Multi Image)
    'flux-kontext-max-multi',
    'flux-kontext-pro-multi',
    'flux-kontext-dev-multi',
    'flux-kontext-dev-multi-ultra-fast',
    // Flux Special
    'flux-krea-dev-lora',
    'flux-fill-dev',
    'flux-controlnet-pro',
    // Alibaba/Qwen
    'wan-2.6-i2i',
    'wan-2.5-edit',
    'wan-2.1-t2i-lora',
    'qwen-image-edit',
    'qwen-image-edit-plus',
    // ByteDance/Seedream
    'seedream-4.5-edit',
    'seedream-4.5-edit-seq',
    'seedream-4-edit',
    'seedream-4-edit-seq',
    'seededit-v3',
    'portrait',
    // Nano Banana (Google)
    'nano-banana-pro-edit-ultra',
    'nano-banana-pro-edit',
    'nano-banana-pro-edit-dev',
    'nano-banana-edit-dev',
    'nano-banana-edit',
    // Luma Photon
    'photon-modify',
    'photon-flash-modify',
    // AtlasCloud Special
    'ghibli',
    'instant-character',
    'hidream-e1-full',
    'step1x-edit',
    // Upscaling
    'recraft-crisp-upscale',
    'recraft-creative-upscale',
    'real-esrgan',
    // Utilities
    'image-zoom-out',
    'image-watermark-remover',
    // Style Transfer
    'plastic-bubble-figure',
    'my-world',
    'micro-landscape-mini-world',
    'glass-ball',
    'felt-keychain',
    'felt-3d-polaroid',
    'advanced-photography',
    'american-comic-style',
  ];

  if (atlasCloudModels.includes(model)) {
    console.log('[ImageGeneration] Routing to Atlas Cloud provider');
    const { generateImageWithAtlas } = await import('./providers/AtlasCloud');
    // Convert dimensions to Atlas format (e.g., "1024*1024")
    const size = options.width && options.height
      ? `${options.width}*${options.height}`
      : '1024*1024';
    console.log('[ImageGeneration] Calling generateImageWithAtlas with:', {
      model,
      size,
      seed: options.seed,
      referenceImageCount: options.referenceImages?.length || 0,
    });
    return await generateImageWithAtlas({
      prompt,
      model: model as AtlasImageModel,
      size,
      seed: options.seed,
      referenceImages: options.referenceImages, // Pass reference images array for image-to-image models
    });
  }

  // Route to FAL.AI (Other Flux and SDXL models)
  if (
    model === 'flux-pro'
    || model === 'flux-realism'
    || model === 'sdxl'
    || model === 'sdxl-lightning'
  ) {
    const { generateImageWithFal } = await import('./providers/FalAI');
    return await generateImageWithFal({
      prompt,
      model: model as FalModel,
      width: options.width,
      height: options.height,
      seed: options.seed,
      negativePrompt: options.negativePrompt,
    });
  }

  throw new Error(`Unsupported model: ${model}`);
}

// Re-export for backward compatibility
export { getAvailableImageModels as getAvailableModels } from './ModelMetadata';
