/**
 * Google Gemini Chat Provider via Vertex AI
 * Supports: Gemini 2.5, Gemini 2.0, Gemini 1.5
 * Includes Langfuse tracing for observability and cost tracking
 */

import type { TraceMetadata } from '../LangfuseTracing';
import type { ChatMessage } from '../TextGeneration';
import { flushLangfuse } from '../Langfuse';
import {
  createTextGeneration,
  createTrace,
  endTextGeneration,

} from '../LangfuseTracing';

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
  traceMetadata?: TraceMetadata;
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

  const { model, messages, temperature = 0.7, maxTokens = 2000, traceMetadata } = options;

  // Create Langfuse trace and generation
  const trace = createTrace('gemini-chat', {
    ...traceMetadata,
    tags: ['gemini', 'vertex-ai', 'chat', ...(traceMetadata?.tags || [])],
  });

  // Update trace with input for better visibility in dashboard
  if (trace) {
    trace.update({
      input: messages,
    });
  }

  const generation = createTextGeneration(trace, 'chat-completion', {
    model,
    input: messages,
    modelParameters: {
      temperature,
      maxTokens,
    },
  });

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

  try {
    // Get access token
    const { GoogleAuth } = await import('google-auth-library');

    // Parse credentials from environment variable
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
      credentials, // Use parsed credentials if available, otherwise falls back to default
      projectId, // Explicitly set project ID
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
      const errorMessage = `Gemini error: ${JSON.stringify(error)}`;

      // End generation with error
      endTextGeneration(generation, {
        output: null,
        statusMessage: errorMessage,
      });
      await flushLangfuse();

      throw new Error(errorMessage);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      const errorMessage = 'No response from Gemini';
      endTextGeneration(generation, {
        output: null,
        statusMessage: errorMessage,
      });
      await flushLangfuse();

      throw new Error(errorMessage);
    }

    // End generation with success and usage data
    // Gemini returns usage metadata in usageMetadata field
    endTextGeneration(generation, {
      output: text,
      usage: {
        inputTokens: result.usageMetadata?.promptTokenCount,
        outputTokens: result.usageMetadata?.candidatesTokenCount,
        totalTokens: result.usageMetadata?.totalTokenCount,
      },
    });

    // Update trace with output for better visibility in dashboard
    if (trace) {
      trace.update({
        output: text,
      });
    }

    // Flush asynchronously (don't block response)
    flushLangfuse().catch(console.error);

    return text;
  } catch (error) {
    // Ensure generation is ended on unexpected errors
    if (generation) {
      endTextGeneration(generation, {
        output: null,
        statusMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      flushLangfuse().catch(console.error);
    }
    throw error;
  }
}
