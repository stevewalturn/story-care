/**
 * Unified Text Generation Service
 * Consolidates all chat/text generation providers into a single interface
 */

import type { OpenAIChatModel } from './providers/OpenAIChat';
import type { GeminiChatModel } from './providers/GeminiChat';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type TextGenModel = OpenAIChatModel | GeminiChatModel;

export interface TextGenerationOptions {
  messages: ChatMessage[];
  model: TextGenModel;
  temperature?: number;
  maxTokens?: number;
}

export interface TextGenerationResult {
  message: string;
  model: string;
}

/**
 * Generate text/chat completion using the specified model
 */
export async function generateText(
  options: TextGenerationOptions,
): Promise<TextGenerationResult> {
  const { model, messages, temperature, maxTokens } = options;

  // Route to OpenAI
  if (
    model === 'gpt-4o'
    || model === 'gpt-4o-mini'
    || model === 'gpt-4-turbo'
    || model === 'o3-mini'
    || model === 'o3'
    || model === 'o3-pro'
    || model === 'o1-pro'
    || model === 'o1'
    || model === 'o1-mini'
  ) {
    const { chatWithOpenAI } = await import('./providers/OpenAIChat');
    const message = await chatWithOpenAI({
      messages,
      model: model as OpenAIChatModel,
      temperature,
      maxTokens,
    });
    return { message, model };
  }

  // Route to Google Gemini
  if (
    model === 'gemini-2.5-pro'
    || model === 'gemini-2.5-flash'
    || model === 'gemini-2.5-flash-lite'
    || model === 'gemini-2.0-flash'
    || model === 'gemini-2.0-flash-lite'
    || model === 'gemini-1.5-pro'
    || model === 'gemini-1.5-flash'
  ) {
    const { chatWithGemini } = await import('./providers/GeminiChat');
    const message = await chatWithGemini({
      messages,
      model: model as GeminiChatModel,
      temperature,
      maxTokens,
    });
    return { message, model };
  }

  throw new Error(`Unsupported model: ${model}`);
}

/**
 * Get all available models grouped by provider
 */
export function getAvailableTextModels() {
  return {
    'OpenAI': [
      { value: 'gpt-4o', label: 'GPT-4o (Latest Multimodal)' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Cost-Efficient)' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Legacy)' },
      { value: 'o3-mini', label: 'o3-mini (Reasoning)' },
      { value: 'o3', label: 'o3 (Advanced Reasoning)' },
      { value: 'o3-pro', label: 'o3-pro (Pro Reasoning)' },
      { value: 'o1-pro', label: 'o1-pro (Reasoning)' },
      { value: 'o1', label: 'o1 (Reasoning)' },
      { value: 'o1-mini', label: 'o1-mini (Reasoning)' },
    ],
    'Google Gemini': [
      { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (1M context)' },
      { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Speed)' },
      { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite (Cost-Efficient)' },
      { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Next-Gen)' },
      { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite' },
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Legacy)' },
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Legacy)' },
    ],
  } as const;
}
