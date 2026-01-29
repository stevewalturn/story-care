/**
 * Google Gemini Image Generation Provider via Vertex AI
 * Supports: Gemini 2.5 Flash Image (Nano Banana) - Image-to-Image generation
 * Authentication: Google Cloud OAuth2 (via google-auth-library)
 * Includes Langfuse tracing for observability and cost tracking
 */

import type { ImageGenerationResult } from '../ImageGeneration';
import { flushLangfuse } from '../Langfuse';
import {
  calculateImageCost,
  createImageSpan,
  createTrace,
  endImageSpan,
  type TraceMetadata,
} from '../LangfuseTracing';

export type GeminiImageModel = 'gemini-2.5-flash-image';

export type GeminiImageOptions = {
  prompt: string;
  model: GeminiImageModel;
  referenceImage?: string; // Base64 or URL
  traceMetadata?: TraceMetadata;
};

type GeminiImageRequestBody = {
  contents: Array<{
    role: string;
    parts: Array<{
      text?: string;
      inline_data?: {
        mime_type: string;
        data: string;
      };
    }>;
  }>;
  generationConfig: {
    temperature: number;
    topP: number;
    maxOutputTokens: number;
    responseModalities: string[];
  };
  safetySettings: Array<{
    category: string;
    threshold: string;
  }>;
};

/**
 * Generate image with Gemini Image models (image-to-image)
 */
export async function generateImageWithGemini(
  options: GeminiImageOptions,
): Promise<ImageGenerationResult> {
  const projectId = process.env.GOOGLE_VERTEX_PROJECT_ID;
  const location = process.env.GOOGLE_VERTEX_LOCATION || 'us-central1';

  if (!projectId) {
    throw new Error('GOOGLE_VERTEX_PROJECT_ID is not configured');
  }

  const { model, prompt, referenceImage, traceMetadata } = options;

  // Create Langfuse trace and span
  const trace = createTrace('gemini-image', {
    ...traceMetadata,
    tags: ['gemini', 'vertex-ai', 'image-generation', model, ...(traceMetadata?.tags || [])],
  });
  const span = createImageSpan(trace, 'generate-image', {
    name: 'gemini-image-generation',
    input: {
      prompt,
      model,
      hasReferenceImage: !!referenceImage,
    },
    metadata: {
      provider: 'google-vertex-ai',
    },
  });

  // Gemini Image requires a reference image for image-to-image
  if (!referenceImage) {
    const errorMessage = 'Reference image is required for Gemini image-to-image generation';
    endImageSpan(span, model, {
      output: null,
      statusMessage: errorMessage,
      level: 'ERROR',
      imageCount: 1,
    });
    await flushLangfuse();
    throw new Error(errorMessage);
  }

  // Prepare the image data
  let imageData: string = '';
  let mimeType: string = 'image/jpeg';

  if (referenceImage.startsWith('data:')) {
    // Extract base64 data from data URL
    const matches = referenceImage.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches || matches.length !== 3 || !matches[1] || !matches[2]) {
      throw new Error('Invalid base64 image format');
    }
    mimeType = matches[1];
    imageData = matches[2];
  } else {
    // If it's a URL, fetch and convert to base64
    const imageResponse = await fetch(referenceImage);
    const imageBuffer = await imageResponse.arrayBuffer();
    imageData = Buffer.from(imageBuffer).toString('base64');
    const contentType = imageResponse.headers.get('content-type');
    if (contentType) {
      mimeType = contentType;
    }
  }

  // Get OAuth2 access token
  const { GoogleAuth } = await import('google-auth-library');

  // Try to get credentials from environment variable
  let credentials;
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    } catch (error) {
      throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_KEY format. Must be valid JSON.');
    }
  }

  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    credentials, // Will use this if provided, otherwise falls back to GOOGLE_APPLICATION_CREDENTIALS or default
    projectId, // Explicitly set project ID
  });

  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();

  if (!accessToken.token) {
    throw new Error('Failed to get Google Cloud access token');
  }

  // Vertex AI endpoint (NOT generativelanguage.googleapis.com)
  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;

  const requestBody: GeminiImageRequestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: imageData,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 1,
      topP: 0.95,
      maxOutputTokens: 32768,
      responseModalities: ['TEXT', 'IMAGE'],
    },
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'OFF',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'OFF',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'OFF',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'OFF',
      },
    ],
  };

  try {
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
      const errorMessage = `Gemini Image error: ${JSON.stringify(error)}`;

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

    // Gemini returns generated images as inline data in the response
    // Note: The API returns camelCase (inlineData) not snake_case (inline_data)
    const imagePart = result.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData || part.inline_data,
    );

    if (!imagePart?.inlineData?.data && !imagePart?.inline_data?.data) {
      console.error('No image found in response. Full result:', JSON.stringify(result, null, 2));
      const errorMessage = 'No image returned from Gemini';

      endImageSpan(span, model, {
        output: null,
        statusMessage: errorMessage,
        level: 'ERROR',
        imageCount: 1,
      });
      await flushLangfuse();

      throw new Error(errorMessage);
    }

    // Handle both camelCase and snake_case response formats
    const generatedImageData = imagePart.inlineData || imagePart.inline_data;
    const generatedMimeType = generatedImageData.mimeType || generatedImageData.mime_type || 'image/png';
    const base64Data = generatedImageData.data;

    // Convert the base64 image data to a data URL
    const imageUrl = `data:${generatedMimeType};base64,${base64Data}`;

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
          ...traceMetadata?.metadata,
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
