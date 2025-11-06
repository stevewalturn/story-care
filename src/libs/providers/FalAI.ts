/**
 * FAL.AI Image Generation Provider
 * Supports: flux-pro, flux-dev, flux-schnell, SDXL, and more models
 * Documentation: https://fal.ai/models
 */

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
};

export async function generateImageWithFal(
  options: FalGenerateOptions,
): Promise<{ imageUrl: string; model: string }> {
  const apiKey = process.env.FAL_API_KEY;

  if (!apiKey) {
    throw new Error('FAL_API_KEY is not configured');
  }

  const model = options.model || 'flux-pro';

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
    throw new Error(`FAL.AI error: ${error.message || response.statusText}`);
  }

  const result = await response.json();

  // FAL.AI returns images array
  if (!result.images || result.images.length === 0) {
    throw new Error('No images generated');
  }

  return {
    imageUrl: result.images[0].url,
    model,
  };
}
