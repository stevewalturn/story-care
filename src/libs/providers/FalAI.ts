/**
 * FAL.AI Image Generation Provider
 * Supports: flux-pro, flux-dev, flux-schnell, SDXL, and more models
 * Documentation: https://fal.ai/models
 * Includes Langfuse tracing for observability and cost tracking
 */

import type { TraceMetadata } from '../LangfuseTracing';
import { flushLangfuse } from '../Langfuse';
import {
  createImageGeneration,
  createTrace,
  endImageGeneration,

} from '../LangfuseTracing';

export type FalModel
  = | 'flux-pro'
    | 'flux-dev'
    | 'flux-schnell'
    | 'flux-realism'
    | 'sdxl'
    | 'sdxl-lightning';

export type FalGenerateOptions = {
  prompt: string;
  model?: FalModel;
  width?: number;
  height?: number;
  numInferenceSteps?: number;
  guidanceScale?: number;
  seed?: number;
  negativePrompt?: string;
  traceMetadata?: TraceMetadata;
};

export async function generateImageWithFal(
  options: FalGenerateOptions,
): Promise<{ imageUrl: string; model: string }> {
  const apiKey = process.env.FAL_API_KEY;

  if (!apiKey) {
    throw new Error('FAL_API_KEY is not configured');
  }

  const model = options.model || 'flux-pro';

  // Create Langfuse trace and generation
  const trace = createTrace('fal-image', {
    ...options.traceMetadata,
    tags: ['fal-ai', 'image-generation', model, ...(options.traceMetadata?.tags || [])],
  });

  // Update trace with input for better visibility in dashboard
  if (trace) {
    trace.update({
      input: { prompt: options.prompt, model, width: options.width || 1024, height: options.height || 1024 },
    });
  }

  const generation = createImageGeneration(trace, 'generate-image', {
    model,
    input: {
      prompt: options.prompt,
      width: options.width || 1024,
      height: options.height || 1024,
    },
    metadata: {
      provider: 'fal-ai',
    },
  });

  // Map model to FAL endpoint
  const modelEndpoints: Record<FalModel, string> = {
    'flux-pro': 'fal-ai/flux-pro',
    'flux-dev': 'fal-ai/flux/dev',
    'flux-schnell': 'fal-ai/flux/schnell',
    'flux-realism': 'fal-ai/flux-realism',
    'sdxl': 'fal-ai/fast-sdxl',
    'sdxl-lightning': 'fal-ai/fast-lightning-sdxl',
  };

  const endpoint = modelEndpoints[model];

  try {
    // FAL.AI API endpoint
    const response = await fetch(`https://fal.run/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: options.prompt,
        image_size: {
          width: options.width || 1024,
          height: options.height || 1024,
        },
        num_inference_steps: options.numInferenceSteps,
        guidance_scale: options.guidanceScale,
        seed: options.seed,
        negative_prompt: options.negativePrompt,
        num_images: 1,
        enable_safety_checker: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      const errorMessage = `FAL.AI error: ${error.message || response.statusText}`;

      endImageGeneration(generation, model, {
        output: null,
        statusMessage: errorMessage,
        level: 'ERROR',
        imageCount: 1,
      });
      await flushLangfuse();

      throw new Error(errorMessage);
    }

    const result = await response.json();

    // FAL.AI returns images array
    if (!result.images || result.images.length === 0) {
      const errorMessage = 'No images generated';

      endImageGeneration(generation, model, {
        output: null,
        statusMessage: errorMessage,
        level: 'ERROR',
        imageCount: 1,
      });
      await flushLangfuse();

      throw new Error(errorMessage);
    }

    // End generation with success (cost is calculated in endImageGeneration)
    endImageGeneration(generation, model, {
      output: { imageUrl: result.images[0].url },
      imageCount: 1,
    });

    // Update trace with output
    if (trace) {
      trace.update({
        output: { imageUrl: result.images[0].url, model },
      });
    }

    // Flush asynchronously (don't block response)
    flushLangfuse().catch(console.error);

    return {
      imageUrl: result.images[0].url,
      model,
    };
  } catch (error) {
    if (generation) {
      endImageGeneration(generation, model, {
        output: null,
        statusMessage: error instanceof Error ? error.message : 'Unknown error',
        level: 'ERROR',
        imageCount: 1,
      });
      flushLangfuse().catch(console.error);
    }
    throw error;
  }
}
