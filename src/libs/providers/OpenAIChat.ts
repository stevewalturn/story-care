/**
 * OpenAI Chat Provider
 * Supports: GPT-4o, GPT-4o-mini, GPT-4-turbo, o-series reasoning models
 */

import type { ChatMessage } from '../TextGeneration';

export type OpenAIChatModel =
  | 'gpt-4o' // Latest multimodal
  | 'gpt-4o-mini' // Cost-efficient
  | 'gpt-4-turbo' // Legacy but good
  | 'o3-mini' // Reasoning (latest)
  | 'o3' // Advanced reasoning
  | 'o3-pro' // Pro reasoning
  | 'o1-pro' // Reasoning
  | 'o1' // Reasoning
  | 'o1-mini'; // Reasoning

export interface OpenAIChatOptions {
  messages: ChatMessage[];
  model: OpenAIChatModel;
  temperature?: number;
  maxTokens?: number;
}

interface OpenAIChatRequestBody {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

export async function chatWithOpenAI(
  options: OpenAIChatOptions,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const { model, messages, temperature = 0.7, maxTokens = 2000 } = options;

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
    throw new Error(`OpenAI error: ${error.error?.message || response.statusText}`);
  }

  const result = await response.json();
  return result.choices[0]?.message?.content || '';
}
