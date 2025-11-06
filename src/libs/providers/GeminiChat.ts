/**
 * Google Gemini Chat Provider via Vertex AI
 * Supports: Gemini 2.5, Gemini 2.0, Gemini 1.5
 */

import type { ChatMessage } from '../TextGeneration';

export type GeminiChatModel
  = | 'gemini-2.5-pro' // Latest, 1M context
    | 'gemini-2.5-flash' // Speed optimized
    | 'gemini-2.5-flash-lite' // Most cost-effective
    | 'gemini-2.0-flash' // Next-gen
    | 'gemini-2.0-flash-lite' // Better quality than 1.5
    | 'gemini-1.5-pro' // Legacy
    | 'gemini-1.5-flash'; // Legacy

export type GeminiChatOptions = {
  messages: ChatMessage[];
  model: GeminiChatModel;
  temperature?: number;
  maxTokens?: number;
};

type GeminiMessage = {
  role: string;
  parts: Array<{ text: string }>;
};

type GeminiChatRequestBody = {
  contents: GeminiMessage[];
  generationConfig: {
    temperature: number;
    maxOutputTokens: number;
  };
  systemInstruction?: {
    parts: Array<{ text: string }>;
  };
};

export async function chatWithGemini(
  options: GeminiChatOptions,
): Promise<string> {
  const projectId = process.env.GOOGLE_VERTEX_PROJECT_ID;
  const location = process.env.GOOGLE_VERTEX_LOCATION || 'us-central1';

  if (!projectId) {
    throw new Error('GOOGLE_VERTEX_PROJECT_ID is not configured');
  }

  const { model, messages, temperature = 0.7, maxTokens = 2000 } = options;

  // Convert OpenAI-style messages to Gemini format
  const geminiMessages = messages
    .filter(msg => msg.role !== 'system')
    .map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

  // Extract system message if present
  const systemInstruction = messages.find(msg => msg.role === 'system')?.content;

  // Vertex AI endpoint
  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;

  // Get access token
  const { GoogleAuth } = await import('google-auth-library');
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();

  if (!accessToken.token) {
    throw new Error('Failed to get Google Cloud access token');
  }

  const requestBody: GeminiChatRequestBody = {
    contents: geminiMessages,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };

  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

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
    throw new Error(`Gemini error: ${JSON.stringify(error)}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response from Gemini');
  }

  return text;
}
