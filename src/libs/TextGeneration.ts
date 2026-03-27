/**
 * Unified Text Generation Service
 * Consolidates all chat/text generation providers into a single interface
 */

import type { TraceMetadata } from './LangfuseTracing';
import type { GeminiChatModel } from './providers/GeminiChat';
import type { OpenAIChatModel } from './providers/OpenAIChat';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type TextGenModel = OpenAIChatModel | GeminiChatModel;

export type TextGenerationOptions = {
  messages: ChatMessage[];
  model: TextGenModel;
  temperature?: number;
  maxTokens?: number;
  traceMetadata?: TraceMetadata;
};

export type TextGenerationResult = {
  message: string;
  model: string;
};

/**
 * Generate text/chat completion using the specified model
 */
export async function generateText(
  options: TextGenerationOptions,
): Promise<TextGenerationResult> {
  const { model, messages, temperature, maxTokens, traceMetadata } = options;

  // Route to OpenAI
  if (
    model === 'gpt-4.1'
    || model === 'gpt-4.1-mini'
    || model === 'gpt-4.1-nano'
    || model === 'gpt-4o'
    || model === 'gpt-4o-mini'
    || model === 'gpt-4-turbo'
    || model === 'gpt-3.5-turbo'
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
      traceMetadata,
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
    // Fallback chain on 429/quota exhaustion: try a lighter model before giving up
    const GEMINI_FALLBACKS: Partial<Record<GeminiChatModel, GeminiChatModel>> = {
      'gemini-2.5-pro': 'gemini-2.5-flash',
      'gemini-2.5-flash': 'gemini-2.5-flash-lite',
      'gemini-2.0-flash': 'gemini-2.0-flash-lite',
    };
    try {
      const message = await chatWithGemini({ messages, model: model as GeminiChatModel, temperature, maxTokens, traceMetadata });
      return { message, model };
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      const is429 = msg.includes('429') || msg.toLowerCase().includes('resource_exhausted');
      const fallback = is429 ? GEMINI_FALLBACKS[model as GeminiChatModel] : undefined;
      if (fallback) {
        const message = await chatWithGemini({ messages, model: fallback, temperature, maxTokens, traceMetadata });
        return { message, model: fallback };
      }
      throw error;
    }
  }

  throw new Error(`Unsupported model: ${model}`);
}

// Re-export for backward compatibility
export { getAvailableTextModels } from './ModelMetadata';
