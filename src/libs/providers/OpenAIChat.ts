/**
 * OpenAI Chat Provider
 * Supports: GPT-4.1, GPT-4o, GPT-4-turbo, GPT-3.5-turbo, o-series reasoning models
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

export type OpenAIChatModel
  = | 'gpt-4.1' // Latest GPT-4.1
    | 'gpt-4.1-mini' // GPT-4.1 Mini
    | 'gpt-4.1-nano' // GPT-4.1 Nano
    | 'gpt-4o' // Latest multimodal
    | 'gpt-4o-mini' // Cost-efficient
    | 'gpt-4-turbo' // Legacy but good
    | 'gpt-3.5-turbo' // Fast and cost-effective
    | 'o3-mini' // Reasoning (latest)
    | 'o3' // Advanced reasoning
    | 'o3-pro' // Pro reasoning
    | 'o1-pro' // Reasoning
    | 'o1' // Reasoning
    | 'o1-mini'; // Reasoning

export type OpenAIChatOptions = {
  messages: ChatMessage[];
  model: OpenAIChatModel;
  temperature?: number;
  maxTokens?: number;
  traceMetadata?: TraceMetadata;
};

type OpenAIChatRequestBody = {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
};

export async function chatWithOpenAI(
  options: OpenAIChatOptions,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const { model, messages, temperature = 0.7, maxTokens = 2000, traceMetadata } = options;

  // Create Langfuse trace and generation
  const trace = createTrace('openai-chat', {
    ...traceMetadata,
    tags: ['openai', 'chat', ...(traceMetadata?.tags || [])],
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

  // o-series models have different parameter requirements
  const isReasoningModel = model.startsWith('o1') || model.startsWith('o3');

  const requestBody: OpenAIChatRequestBody = {
    model,
    messages,
  };

  // Regular models support temperature and max_tokens
  if (!isReasoningModel) {
    requestBody.temperature = temperature;
    requestBody.max_tokens = maxTokens;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      const errorMessage = `OpenAI error: ${error.error?.message || response.statusText}`;

      // End generation with error
      endTextGeneration(generation, {
        output: null,
        statusMessage: errorMessage,
      });
      await flushLangfuse();

      throw new Error(errorMessage);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content || '';

    // End generation with success and usage data
    endTextGeneration(generation, {
      output: content,
      usage: {
        inputTokens: result.usage?.prompt_tokens,
        outputTokens: result.usage?.completion_tokens,
        totalTokens: result.usage?.total_tokens,
      },
    });

    // Update trace with output for better visibility in dashboard
    if (trace) {
      trace.update({
        output: content,
      });
    }

    // Flush asynchronously (don't block response)
    flushLangfuse().catch(console.error);

    return content;
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
