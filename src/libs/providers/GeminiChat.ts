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

// Module-level access token cache — tokens are valid ~60 min, refresh 5 min early
let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(projectId: string): Promise<string> {
  const now = Date.now();
  if (cachedAccessToken && cachedAccessToken.expiresAt > now) {
    return cachedAccessToken.token;
  }

  const { GoogleAuth } = await import('google-auth-library');
  let credentials: object | undefined;
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY) as object;
    } catch {
      throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_KEY format. Must be valid JSON.');
    }
  }

  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    credentials,
    projectId,
  });

  const client = await auth.getClient();
  const result = await client.getAccessToken();

  if (!result.token) {
    throw new Error('Failed to get Google Cloud access token');
  }

  // Cache for 55 minutes (5-min buffer before 60-min expiry)
  cachedAccessToken = { token: result.token, expiresAt: now + 55 * 60 * 1000 };
  return result.token;
}

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

  // Concatenate ALL system messages into a single instruction string
  const systemMessages = messages.filter(msg => msg.role === 'system');
  const systemInstruction = systemMessages.length > 0
    ? systemMessages.map(msg => msg.content).join('\n\n---\n\n')
    : undefined;

  // Convert non-system messages to Gemini format.
  // Merge consecutive same-role messages — Gemini requires strict user/model alternation.
  const rawMessages = messages
    .filter(msg => msg.role !== 'system')
    .map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

  const geminiMessages: GeminiMessage[] = [];
  for (const msg of rawMessages) {
    const last = geminiMessages[geminiMessages.length - 1];
    if (last && last.role === msg.role) {
      last.parts[0]!.text += '\n\n' + msg.parts[0]!.text;
    } else {
      geminiMessages.push({ role: msg.role, parts: [{ text: msg.parts[0]!.text }] });
    }
  }

  // Priority PayGo requires the global endpoint (not regional).
  // Enable by setting VERTEX_AI_PRIORITY_PAYGO=true in environment variables.
  const usePriorityPaygo = process.env.VERTEX_AI_PRIORITY_PAYGO === 'true';
  // Global endpoint has a different hostname (no region prefix): aiplatform.googleapis.com
  // Regional endpoint: {region}-aiplatform.googleapis.com
  const endpoint = usePriorityPaygo
    ? `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/global/publishers/google/models/${model}:generateContent`
    : `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;

  try {
    const token = await getAccessToken(projectId);

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

    // Build request headers — add Priority PayGo headers when enabled.
    // Docs: https://cloud.google.com/vertex-ai/generative-ai/docs/priority-paygo
    const requestHeaders: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    if (usePriorityPaygo) {
      // Use Priority PayGo only (no Provisioned Throughput spill-over)
      requestHeaders['X-Vertex-AI-LLM-Request-Type'] = 'shared';
      requestHeaders['X-Vertex-AI-LLM-Shared-Request-Type'] = 'priority';
    }

    // Retry up to 2 times on 429 with exponential backoff (1s, 2s)
    const RETRY_DELAYS = [1000, 2000];
    let lastResponse: Response | null = null;
    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
      if (attempt > 0) {
        await new Promise<void>(resolve => setTimeout(resolve, RETRY_DELAYS[attempt - 1]!));
      }
      lastResponse = await fetch(endpoint, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
      });
      if (lastResponse.status !== 429) break;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const response = lastResponse!;
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
