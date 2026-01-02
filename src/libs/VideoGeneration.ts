/**
 * Unified Video Generation Service
 * Consolidates all video generation providers into a single interface
 */

import type { AtlasVideoModel } from './providers/AtlasCloud';

// All available video models
export type VideoGenModel = AtlasVideoModel;

export type VideoGenerationOptions = {
  prompt: string;
  model: VideoGenModel;
  referenceImage?: string; // Base64 or URL for image-to-video
  duration?: number; // seconds
  fps?: number;
  seed?: number;
};

export type VideoGenerationResult = {
  videoUrl: string;
  model: string;
};

/**
 * Generate a video using the specified model
 * All 46 video models are routed to Atlas Cloud
 */
export async function generateVideo(
  options: VideoGenerationOptions,
): Promise<VideoGenerationResult> {
  const { model, prompt } = options;

  // All video models route to Atlas Cloud
  const { generateVideoWithAtlas } = await import('./providers/AtlasCloud');
  return await generateVideoWithAtlas({
    prompt,
    model: model as AtlasVideoModel,
    referenceImage: options.referenceImage,
    duration: options.duration,
    fps: options.fps,
    seed: options.seed,
  });
}

// Re-export for convenience
export { getAvailableVideoModels } from './ModelMetadata';
