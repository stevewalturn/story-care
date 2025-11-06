/**
 * Replicate Image Generation Provider
 * Supports: Various models via Replicate API
 */

export type ReplicateModel =
  | 'kandinsky-2.2'
  | 'playground-v2.5'
  | 'sdxl-lightning';

export interface ReplicateGenerateOptions {
  prompt: string;
  model?: ReplicateModel;
  negativePrompt?: string;
  width?: number;
  height?: number;
  numInferenceSteps?: number;
  guidanceScale?: number;
  seed?: number;
}

// Model version mappings
const MODEL_VERSIONS: Record<ReplicateModel, string> = {
  'kandinsky-2.2': 'ai-forever/kandinsky-2.2:ea1addaab376f4dc227f5368bbd8eff901820fd1cc14ed8cad63b29249e9d463',
  'playground-v2.5': 'playgroundai/playground-v2.5-1024px-aesthetic:a45f82a1382bed5c7aeb861dac7c7d191b0fdf74d8d57c4a0e6ed7d4d0bf7d24',
  'sdxl-lightning': 'bytedance/sdxl-lightning-4step:5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637',
};

export async function generateImageWithReplicate(
  options: ReplicateGenerateOptions,
): Promise<{ imageUrl: string; model: string }> {
  const apiToken = process.env.REPLICATE_API_TOKEN;

  if (!apiToken) {
    throw new Error('REPLICATE_API_TOKEN is not configured');
  }

  const model = options.model || 'playground-v2.5';
  const modelVersion = MODEL_VERSIONS[model];

  // Create prediction
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: modelVersion.split(':')[1],
      input: {
        prompt: options.prompt,
        negative_prompt: options.negativePrompt,
        width: options.width || 1024,
        height: options.height || 1024,
        num_inference_steps: options.numInferenceSteps || 50,
        guidance_scale: options.guidanceScale || 7.5,
        seed: options.seed,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(`Replicate error: ${error.detail || response.statusText}`);
  }

  const prediction = await response.json();

  // Poll for completion
  let attempts = 0;
  const maxAttempts = 60;
  let currentPrediction = prediction;

  while (attempts < maxAttempts) {
    if (currentPrediction.status === 'succeeded') {
      const imageUrl = Array.isArray(currentPrediction.output)
        ? currentPrediction.output[0]
        : currentPrediction.output;

      return {
        imageUrl,
        model,
      };
    }

    if (currentPrediction.status === 'failed' || currentPrediction.status === 'canceled') {
      throw new Error(`Replicate generation failed: ${currentPrediction.error || 'Unknown error'}`);
    }

    // Wait 1 second before next poll
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Fetch updated status
    const statusResponse = await fetch(
      `https://api.replicate.com/v1/predictions/${currentPrediction.id}`,
      {
        headers: {
          'Authorization': `Token ${apiToken}`,
        },
      },
    );

    if (statusResponse.ok) {
      currentPrediction = await statusResponse.json();
    }

    attempts++;
  }

  throw new Error('Replicate generation timed out');
}
