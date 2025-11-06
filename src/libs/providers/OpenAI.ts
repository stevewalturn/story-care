/**
 * OpenAI Image Generation Provider
 * Supports: DALL-E 2, DALL-E 3
 */

export type OpenAIModel = 'dall-e-2' | 'dall-e-3';
export type OpenAISize = '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
export type OpenAIQuality = 'standard' | 'hd';
export type OpenAIStyle = 'natural' | 'vivid';

export type OpenAIGenerateOptions = {
  prompt: string;
  model?: OpenAIModel;
  size?: OpenAISize;
  quality?: OpenAIQuality;
  style?: OpenAIStyle;
  n?: number;
};

export async function generateImageWithOpenAI(
  options: OpenAIGenerateOptions,
): Promise<{ imageUrl: string; model: string }> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const model = options.model || 'dall-e-3';

  // DALL-E 2 only supports certain sizes
  let size = options.size || '1024x1024';
  if (model === 'dall-e-2' && !['256x256', '512x512', '1024x1024'].includes(size)) {
    size = '1024x1024';
  }

  const requestBody: any = {
    model,
    prompt: options.prompt,
    n: options.n || 1,
    size,
  };

  // DALL-E 3 specific parameters
  if (model === 'dall-e-3') {
    requestBody.quality = options.quality || 'standard';
    requestBody.style = options.style || 'vivid';
  }

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(`OpenAI error: ${error.error?.message || response.statusText}`);
  }

  const result = await response.json();

  if (!result.data || result.data.length === 0) {
    throw new Error('No image generated from OpenAI');
  }

  return {
    imageUrl: result.data[0].url,
    model,
  };
}
