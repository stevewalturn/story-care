/**
 * Stability AI Image Generation Provider
 * Supports: Stable Diffusion XL, SD 3.5, SD 3
 * Includes Langfuse tracing for observability and cost tracking
 */

import { flushLangfuse } from '../Langfuse';
import {
  calculateImageCost,
  createImageSpan,
  createTrace,
  endImageSpan,
  type TraceMetadata,
} from '../LangfuseTracing';

export type StabilityModel = 'sd3.5-large' | 'sd3.5-medium' | 'sd3-large' | 'sdxl-1.0';

export type StabilityGenerateOptions = {
  prompt: string;
  model?: StabilityModel;
  negativePrompt?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  seed?: number;
  outputFormat?: 'png' | 'jpeg' | 'webp';
  traceMetadata?: TraceMetadata;
};

export async function generateImageWithStability(
  options: StabilityGenerateOptions,
): Promise<{ imageUrl: string; model: string }> {
  const apiKey = process.env.STABILITY_API_KEY;

  if (!apiKey) {
    throw new Error('STABILITY_API_KEY is not configured');
  }

  const model = options.model || 'sd3.5-large';

  // Create Langfuse trace and span
  const trace = createTrace('stability-image', {
    ...options.traceMetadata,
    tags: ['stability-ai', 'image-generation', model, ...(options.traceMetadata?.tags || [])],
  });
  const span = createImageSpan(trace, 'generate-image', {
    name: 'stability-image-generation',
    input: {
      prompt: options.prompt,
      model,
      aspectRatio: options.aspectRatio,
    },
    metadata: {
      provider: 'stability-ai',
    },
  });

  // Map model to API endpoint
  const modelEndpoints: Record<StabilityModel, string> = {
    'sd3.5-large': 'v2beta/stable-image/generate/sd3',
    'sd3.5-medium': 'v2beta/stable-image/generate/sd3',
    'sd3-large': 'v2beta/stable-image/generate/sd3',
    'sdxl-1.0': 'v2beta/stable-image/generate/ultra',
  };

  const endpoint = modelEndpoints[model];

  const formData = new FormData();
  formData.append('prompt', options.prompt);
  formData.append('model', model);

  if (options.negativePrompt) {
    formData.append('negative_prompt', options.negativePrompt);
  }

  if (options.aspectRatio) {
    formData.append('aspect_ratio', options.aspectRatio);
  }

  if (options.seed) {
    formData.append('seed', options.seed.toString());
  }

  formData.append('output_format', options.outputFormat || 'png');

  try {
    const response = await fetch(
      `https://api.stability.ai/${endpoint}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      const errorMessage = `Stability AI error: ${error.message || response.statusText}`;

      endImageSpan(span, model, {
        output: null,
        statusMessage: errorMessage,
        level: 'ERROR',
        imageCount: 1,
      });
      await flushLangfuse();

      throw new Error(errorMessage);
    }

    const result = await response.json();

    // Stability returns base64 image in 'image' field
    const base64Image = result.image;
    const imageUrl = `data:image/${options.outputFormat || 'png'};base64,${base64Image}`;

    // Calculate cost and end span
    const cost = calculateImageCost(model, 1);

    endImageSpan(span, model, {
      output: { imageUrl: '[base64 image]' },
      imageCount: 1,
    });

    // Log cost if calculated
    if (trace && cost !== undefined) {
      trace.update({
        metadata: {
          ...options.traceMetadata?.metadata,
          calculatedCost: cost,
        },
      });
    }

    // Flush asynchronously (don't block response)
    flushLangfuse().catch(console.error);

    return {
      imageUrl,
      model,
    };
  } catch (error) {
    if (span) {
      endImageSpan(span, model, {
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
