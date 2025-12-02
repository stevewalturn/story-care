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
  referenceImage?: string; // Base64 or URL for image-to-image
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

  // Route to Google Gemini (Image-to-Image)
  if (model === 'gemini-2.5-flash-image') {
    const { generateImageWithGemini } = await import('./providers/GeminiImage');
    return await generateImageWithGemini({
      prompt,
      model,
      referenceImage: options.referenceImage,
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

  // Route to Atlas Cloud (Flux models)
  if (model === 'flux-dev' || model === 'flux-schnell' || model === 'flux-redux-dev') {
    const { generateImageWithAtlas } = await import('./providers/AtlasCloud');
    // Convert dimensions to Atlas format (e.g., "1024*1024")
    const size = options.width && options.height
      ? `${options.width}*${options.height}`
      : '1024*1024';
    return await generateImageWithAtlas({
      prompt,
      model: model as AtlasImageModel,
      size,
      seed: options.seed,
      referenceImage: options.referenceImage, // Pass reference image for Flux Redux
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
