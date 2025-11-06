/**
 * Google Vertex AI Image Generation Provider
 * Supports: Imagen 3, Imagen 2
 */

export type ImagenModel = 'imagen-3.0-generate-001' | 'imagegeneration@006';

export interface VertexGenerateOptions {
  prompt: string;
  model?: ImagenModel;
  negativePrompt?: string;
  aspectRatio?: '1:1' | '9:16' | '16:9' | '4:3' | '3:4';
  numberOfImages?: number;
  seed?: number;
}

export async function generateImageWithVertex(
  options: VertexGenerateOptions,
): Promise<{ imageUrl: string; model: string }> {
  const projectId = process.env.GOOGLE_VERTEX_PROJECT_ID;
  const location = process.env.GOOGLE_VERTEX_LOCATION || 'us-central1';

  if (!projectId) {
    throw new Error('GOOGLE_VERTEX_PROJECT_ID is not configured');
  }

  const model = options.model || 'imagen-3.0-generate-001';

  // Use Google Cloud's Vertex AI REST API
  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`;

  // Get access token from service account
  const { GoogleAuth } = await import('google-auth-library');
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();

  if (!accessToken.token) {
    throw new Error('Failed to get Google Cloud access token');
  }

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
      'Authorization': `Bearer ${accessToken.token}`,
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
