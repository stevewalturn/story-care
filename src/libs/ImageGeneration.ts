/**
 * Unified Image Generation Service
 * Consolidates all image generation providers into a single interface
 */

import type { FalGenerateOptions, FalModel } from './providers/FalAI';
import type { ImagenModel, VertexGenerateOptions } from './providers/VertexAI';
import type { ReplicateGenerateOptions, ReplicateModel } from './providers/Replicate';
import type { StabilityGenerateOptions, StabilityModel } from './providers/StabilityAI';

// OpenAI Models
export type OpenAIModel = 'dall-e-2' | 'dall-e-3';

// All available models
export type ImageGenModel =
  | OpenAIModel
  | StabilityModel
  | FalModel
  | ImagenModel
  | ReplicateModel;

export interface ImageGenerationOptions {
  prompt: string;
  model: ImageGenModel;
  negativePrompt?: string;
  width?: number;
  height?: number;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  seed?: number;
  quality?: 'standard' | 'hd';
  style?: 'natural' | 'vivid';
}

export interface ImageGenerationResult {
  imageUrl: string;
  model: string;
}

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

  // Route to Replicate
  if (
    model === 'kandinsky-2.2'
    || model === 'playground-v2.5'
    || model === 'sdxl-lightning'
  ) {
    const { generateImageWithReplicate } = await import('./providers/Replicate');
    return await generateImageWithReplicate({
      prompt,
      model: model as ReplicateModel,
      negativePrompt: options.negativePrompt,
      width: options.width,
      height: options.height,
      seed: options.seed,
    });
  }

  throw new Error(`Unsupported model: ${model}`);
}

/**
 * Get all available models grouped by provider
 */
export function getAvailableModels() {
  return {
    'OpenAI': [
      { value: 'dall-e-2', label: 'DALL-E 2' },
      { value: 'dall-e-3', label: 'DALL-E 3' },
    ],
    'Stability AI': [
      { value: 'sd3.5-large', label: 'Stable Diffusion 3.5 Large' },
      { value: 'sd3.5-medium', label: 'Stable Diffusion 3.5 Medium' },
      { value: 'sd3-large', label: 'Stable Diffusion 3 Large' },
      { value: 'sdxl-1.0', label: 'Stable Diffusion XL 1.0' },
    ],
    'FAL.AI': [
      { value: 'flux-pro', label: 'Flux Pro' },
      { value: 'flux-dev', label: 'Flux Dev' },
      { value: 'flux-schnell', label: 'Flux Schnell' },
      { value: 'flux-realism', label: 'Flux Realism' },
      { value: 'sdxl', label: 'Fast SDXL' },
      { value: 'sdxl-lightning', label: 'SDXL Lightning' },
    ],
    'Google Vertex AI': [
      { value: 'imagen-3.0-generate-001', label: 'Imagen 3' },
      { value: 'imagegeneration@006', label: 'Imagen 2' },
    ],
    'Replicate': [
      { value: 'kandinsky-2.2', label: 'Kandinsky 2.2' },
      { value: 'playground-v2.5', label: 'Playground v2.5' },
      { value: 'sdxl-lightning', label: 'SDXL Lightning' },
    ],
  } as const;
}
