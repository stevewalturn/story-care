/**
 * Unified Image Generation Service
 * Consolidates all image generation providers into a single interface
 */

import type { FalModel } from './providers/FalAI';
import type { StabilityModel } from './providers/StabilityAI';
import type { ImagenModel } from './providers/VertexAI';

// OpenAI Models
export type OpenAIModel = 'dall-e-2' | 'dall-e-3';

// All available models
export type ImageGenModel
  = | OpenAIModel
    | StabilityModel
    | FalModel
    | ImagenModel;

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

  // Route to OpenAI (DALL-E)
  if (model === 'dall-e-2' || model === 'dall-e-3') {
    const { generateImageWithOpenAI } = await import('./providers/OpenAI');
    return await generateImageWithOpenAI({
      prompt,
      model,
      size: options.width && options.height ? `${options.width}x${options.height}` as any : undefined,
      quality: options.quality,
      style: options.style,
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

  // Route to FAL.AI
  if (
    model === 'flux-pro'
    || model === 'flux-dev'
    || model === 'flux-schnell'
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

  // Route to Google Vertex AI (Imagen)
  if (model === 'imagen-3.0-generate-001' || model === 'imagegeneration@006') {
    const { generateImageWithVertex } = await import('./providers/VertexAI');
    return await generateImageWithVertex({
      prompt,
      model: model as ImagenModel,
      negativePrompt: options.negativePrompt,
      aspectRatio: options.aspectRatio,
      seed: options.seed,
    });
  }

  throw new Error(`Unsupported model: ${model}`);
}

// Re-export for backward compatibility
export { getAvailableImageModels as getAvailableModels } from './ModelMetadata';
