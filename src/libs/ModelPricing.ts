/**
 * AI Model Pricing Information
 * Used for cost tracking with Langfuse
 *
 * NOTE: For common models (OpenAI, Anthropic, etc.), Langfuse has built-in
 * automatic cost calculation. We only need to define pricing for:
 * - Custom/proprietary models (Atlas Cloud, Suno, etc.)
 * - Models not in Langfuse's database
 *
 * Text models: Langfuse auto-detects pricing for OpenAI, Anthropic, Google, etc.
 * See: https://langfuse.com/docs/model-usage-and-cost
 */

// ============================================================
// Custom Model Pricing (not auto-detected by Langfuse)
// ============================================================

/**
 * Image generation pricing (per image)
 * These are custom models not tracked by Langfuse's built-in pricing
 */
export const IMAGE_MODEL_PRICING: Record<string, number> = {
  // Atlas Cloud - Flux Models (approximate pricing)
  'flux-schnell': 0.003,
  'flux-dev': 0.025,
  'flux-1.1-pro-ultra': 0.06,
  'flux-1.1-pro': 0.04,
  'flux-kontext-max': 0.08,
  'flux-kontext-pro': 0.05,
  'flux-kontext-dev': 0.025,

  // Atlas Cloud - Other Models
  'seedream-4.5-t2i': 0.03,
  'imagen4-ultra': 0.08,
  'imagen4': 0.04,
  'ideogram-v3-quality': 0.08,
  'recraft-v3': 0.04,

  // Stability AI
  'sd3.5-large': 0.065,
  'sd3.5-medium': 0.035,
  'sdxl-1.0': 0.04,

  // FAL.AI
  'flux-pro': 0.05,

  // Google Gemini Image
  'gemini-2.5-flash-image': 0.04,
};

/**
 * Video generation pricing (per second)
 */
export const VIDEO_MODEL_PRICING: Record<string, number> = {
  // Premium tier
  'sora-2-i2v-pro': 0.50,
  'sora-2-i2v': 0.30,
  'veo3.1-i2v': 0.40,
  'seedance-v1.5-pro-i2v': 0.15,
  'kling-2.6-pro-i2v': 0.20,

  // Standard tier
  'hailuo-2.3-standard-i2v': 0.08,
  'ltx-2-pro-i2v': 0.08,

  // Budget tier
  'wan-2.6-i2v': 0.04,
  'wan-2.5-i2v': 0.035,
  'ltx-2-fast-i2v': 0.03,
};

/**
 * Audio transcription pricing (per minute)
 */
export const TRANSCRIPTION_MODEL_PRICING: Record<string, number> = {
  // Deepgram nova-2 variants
  'nova-2': 0.0043,
  'nova': 0.0035,
  'enhanced': 0.0145,
  'base': 0.0125,
};

/**
 * Music generation pricing (per minute of generated audio)
 */
export const MUSIC_MODEL_PRICING: Record<string, number> = {
  'V4': 0.04,
  'V4_5': 0.05,
  'V4_5PLUS': 0.06,
  'V4_5ALL': 0.06,
  'V5': 0.08,
};

// ============================================================
// Consolidated Pricing Export
// ============================================================

export const MODEL_PRICING = {
  image: IMAGE_MODEL_PRICING,
  video: VIDEO_MODEL_PRICING,
  transcription: TRANSCRIPTION_MODEL_PRICING,
  music: MUSIC_MODEL_PRICING,
} as const;

/**
 * Get image generation cost (returns undefined if not found)
 */
export function getImageCost(model: string): number | undefined {
  return IMAGE_MODEL_PRICING[model];
}

/**
 * Get video generation cost per second (returns undefined if not found)
 */
export function getVideoCostPerSecond(model: string): number | undefined {
  return VIDEO_MODEL_PRICING[model];
}

/**
 * Get transcription cost per minute (returns undefined if not found)
 */
export function getTranscriptionCostPerMinute(model: string): number | undefined {
  return TRANSCRIPTION_MODEL_PRICING[model];
}

/**
 * Get music generation cost per minute (returns undefined if not found)
 */
export function getMusicCostPerMinute(model: string): number | undefined {
  return MUSIC_MODEL_PRICING[model];
}
