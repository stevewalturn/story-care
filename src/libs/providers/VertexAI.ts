/**
 * Google Vertex AI Image Generation Provider
 * Supports: Imagen 4.0, Imagen 3.0, Imagen 2
 *
 * Authentication: VERTEX_API_KEY (simple API key authentication)
 */

export type ImagenModel =
  | 'imagen-4.0-generate-001'
  | 'imagen-4.0-fast-generate-001'
  | 'imagen-4.0-ultra-generate-001'
  | 'imagen-3.0-generate-002'
  | 'imagen-3.0-generate-001'
  | 'imagen-3.0-fast-generate-001'
  | 'imagen-3.0-capability-001'
  | 'imagegeneration@006';

export type VertexGenerateOptions = {
  prompt: string;
  model?: ImagenModel;
  negativePrompt?: string;
  aspectRatio?: '1:1' | '9:16' | '16:9' | '4:3' | '3:4';
  numberOfImages?: number;
  seed?: number;
};

export async function generateImageWithVertex(
  options: VertexGenerateOptions,
): Promise<{ imageUrl: string; model: string }> {
  const apiKey = process.env.VERTEX_API_KEY;

  if (!apiKey) {
    throw new Error('VERTEX_API_KEY is not configured');
  }

  const model = options.model || 'imagen-4.0-fast-generate-001';

  // Use Gemini API endpoint with API key
  const endpoint = `https://aiplatform.googleapis.com/v1/publishers/google/models/${model}:predict?key=${apiKey}`;

  const requestBody = {
    instances: [
      {
        prompt: options.prompt,
      },
    ],
    parameters: {
      sampleCount: 1,
      aspectRatio: options.aspectRatio || '1:1',
      negativePrompt: options.negativePrompt,
      seed: options.seed,
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Vertex AI error: ${JSON.stringify(error)}`);
  }

  const result = await response.json();

  // Vertex AI returns base64 encoded images
  const prediction = result.predictions?.[0];
  if (!prediction || !prediction.bytesBase64Encoded) {
    throw new Error('No image generated from Vertex AI');
  }

  const imageUrl = `data:image/png;base64,${prediction.bytesBase64Encoded}`;

  return {
    imageUrl,
    model,
  };
}
