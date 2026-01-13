/**
 * Model Context Window Limits
 * Defines safe transcript lengths for each AI model to prevent context overflow
 */

export type TextGenModel
  = | 'gpt-4.1'
    | 'gpt-4.1-mini'
    | 'gpt-4.1-nano'
    | 'gpt-4o'
    | 'gpt-4o-mini'
    | 'gpt-4-turbo'
    | 'gpt-3.5-turbo'
    | 'o3-mini'
    | 'o3'
    | 'o3-pro'
    | 'o1-pro'
    | 'o1'
    | 'o1-mini'
    | 'gemini-2.5-pro'
    | 'gemini-2.5-flash'
    | 'gemini-2.5-flash-lite'
    | 'gemini-2.0-flash'
    | 'gemini-2.0-flash-lite'
    | 'gemini-1.5-pro'
    | 'gemini-1.5-flash';

/**
 * Context window limits by model (in tokens)
 * Source: Official model documentation
 */
const MODEL_CONTEXT_LIMITS: Record<TextGenModel, number> = {
  // OpenAI GPT-4.1 series - 1M token context (April 2025 release)
  'gpt-4.1': 1000000,
  'gpt-4.1-mini': 1000000,
  'gpt-4.1-nano': 1000000,

  // OpenAI GPT-4o series - 128K token context
  'gpt-4o': 128000,
  'gpt-4o-mini': 128000,
  'gpt-4-turbo': 128000,

  // OpenAI GPT-3.5 - 16K token context
  'gpt-3.5-turbo': 16000,

  // OpenAI o-series reasoning models - 200K token context
  'o3-mini': 200000,
  'o3': 200000,
  'o3-pro': 200000,
  'o1-pro': 200000,
  'o1': 200000,
  'o1-mini': 200000,

  // Google Gemini 2.5 series - 1M token context
  'gemini-2.5-pro': 1000000,
  'gemini-2.5-flash': 1000000,
  'gemini-2.5-flash-lite': 1000000,

  // Google Gemini 2.0 series - 1M token context
  'gemini-2.0-flash': 1000000,
  'gemini-2.0-flash-lite': 1000000,

  // Google Gemini 1.5 series - 1M token context
  'gemini-1.5-pro': 1000000,
  'gemini-1.5-flash': 1000000,
};

/**
 * Calculate safe transcript length for a given model
 * Reserves space for system prompts, chat history, and response
 *
 * @param model - AI model identifier
 * @returns Maximum safe transcript length in characters
 */
export function getMaxTranscriptLength(model: string): number {
  const modelKey = model as TextGenModel;
  const contextLimit = MODEL_CONTEXT_LIMITS[modelKey];

  console.log('[ModelContextLimits] Model:', model);
  console.log('[ModelContextLimits] Context limit:', contextLimit, 'tokens');

  if (!contextLimit) {
    // Unknown model - use conservative default (50K chars ~= 12.5K tokens)
    console.warn(`[ModelContextLimits] Unknown model: ${model}. Using conservative transcript limit.`);
    return 50000;
  }

  // Reserve tokens for:
  // - System prompts: ~2K tokens
  // - Session/module context: ~3K tokens
  // - Chat history: ~5K tokens
  // - Response generation: ~8K tokens
  // Total reserved: ~18K tokens
  const reservedTokens = 18000;

  // Available tokens for transcript
  const availableTokens = Math.max(contextLimit - reservedTokens, 1000);

  // Convert tokens to characters (conservative estimate: 4 chars per token)
  const maxChars = availableTokens * 4;

  console.log('[ModelContextLimits] Reserved tokens:', reservedTokens);
  console.log('[ModelContextLimits] Available tokens:', availableTokens);
  console.log('[ModelContextLimits] Max characters:', maxChars);

  return Math.floor(maxChars);
}

/**
 * Get model display name for UI
 */
export function getModelDisplayName(model: string): string {
  const modelGroups = [
    {
      provider: 'OpenAI',
      models: [
        { id: 'gpt-4.1', name: 'GPT-4.1' },
        { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
        { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano' },
        { id: 'gpt-4o', name: 'GPT-4o' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
        { id: 'o3-mini', name: 'o3 Mini' },
        { id: 'o3', name: 'o3' },
        { id: 'o3-pro', name: 'o3 Pro' },
        { id: 'o1-pro', name: 'o1 Pro' },
        { id: 'o1', name: 'o1' },
        { id: 'o1-mini', name: 'o1 Mini' },
      ],
    },
    {
      provider: 'Google',
      models: [
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
        { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
        { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
      ],
    },
  ];

  for (const group of modelGroups) {
    const foundModel = group.models.find(m => m.id === model);
    if (foundModel)
      return foundModel.name;
  }

  return model;
}
