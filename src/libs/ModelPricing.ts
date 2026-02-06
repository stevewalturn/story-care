/**
 * AI Model Pricing Information
 * Used as initial/fallback pricing for cost tracking with Langfuse.
 *
 * NOTE: For runtime cost calculation, prefer fetching from the ai_models DB table
 * (via AiModelService) since admins may update pricing in the super admin UI.
 *
 * For common models (OpenAI, Anthropic, etc.), Langfuse has built-in
 * automatic cost calculation. We only need to define pricing for:
 * - Custom/proprietary models (Atlas Cloud, Suno, etc.)
 * - Models not in Langfuse's database
 *
 * Prices verified against: https://www.atlascloud.ai/pricing/models
 * Last verified: 2026-02-06
 */

// ============================================================
// Custom Model Pricing (not auto-detected by Langfuse)
// ============================================================

/**
 * Image generation pricing (per image)
 * These are custom models not tracked by Langfuse's built-in pricing
 */
export const IMAGE_MODEL_PRICING: Record<string, number> = {
  // Atlas Cloud - Flux Models
  'flux-schnell': 0.003,
  'flux-dev': 0.012,
  'flux-dev-ultra-fast': 0.005,
  'flux-dev-lora': 0.015,
  'flux-dev-lora-ultra-fast': 0.006,
  'flux-schnell-lora': 0.005,
  'flux-1.1-pro-ultra': 0.06,
  'flux-1.1-pro': 0.04,
  'flux-2-flex-t2i': 0.06,
  'flux-kontext-max': 0.08,
  'flux-kontext-max-t2i': 0.08,
  'flux-kontext-pro': 0.04,
  'flux-kontext-pro-t2i': 0.04,
  'flux-kontext-dev': 0.025,
  'flux-kontext-dev-ultra-fast': 0.02,
  'flux-kontext-dev-lora': 0.03,
  'flux-kontext-dev-lora-ultra-fast': 0.025,
  'flux-kontext-max-multi': 0.08,
  'flux-kontext-pro-multi': 0.04,
  'flux-kontext-dev-multi': 0.03,
  'flux-kontext-dev-multi-ultra-fast': 0.025,
  'flux-redux-dev': 0.025,
  'flux-redux-pro': 0.025,
  'flux-2-dev-edit': 0.024,
  'flux-2-pro-edit': 0.03,
  'flux-2-flex-edit': 0.12,
  'flux-krea-dev-lora': 0.02,
  'flux-krea-dev-lora-t2i': 0.02,
  'flux-fill-dev': 0.035,
  'flux-controlnet-pro': 0.03,

  // Atlas Cloud - Seedream/ByteDance
  'seedream-4.5-t2i': 0.038,
  'seedream-4.5-seq-t2i': 0.038,
  'seedream-4-t2i': 0.02565,
  'seedream-4-seq-t2i': 0.02565,
  'seedream-3.1-t2i': 0.027,
  'seedream-3-t2i': 0.027,
  'seedream-4.5-edit': 0.038,
  'seedream-4.5-edit-seq': 0.038,
  'seedream-4-edit': 0.02565,
  'seedream-4-edit-seq': 0.02565,
  'seededit-v3': 0.027,

  // Atlas Cloud - Google Imagen
  'imagen4-ultra': 0.048,
  'imagen4': 0.032,
  'imagen4-fast': 0.016,
  'atlascloud-imagen4': 0.032,
  'imagen3': 0.032,
  'imagen3-fast': 0.016,

  // Atlas Cloud - Nano Banana/Gemini
  'nano-banana-pro-t2i-ultra': 0.15,
  'nano-banana-pro-t2i': 0.112,
  'nano-banana-pro-t2i-dev': 0.05,
  'nano-banana-t2i': 0.0304,
  'nano-banana-t2i-dev': 0.01,
  'gemini-2.5-flash-t2i': 0.0304,
  'gemini-2.5-flash-t2i-dev': 0.01,
  'nano-banana-pro-edit-ultra': 0.15,
  'nano-banana-pro-edit': 0.112,
  'nano-banana-pro-edit-dev': 0.05,
  'nano-banana-edit-dev': 0.01,
  'nano-banana-edit': 0.0304,

  // Atlas Cloud - Ideogram
  'ideogram-v3-quality': 0.09,
  'ideogram-v3-balanced': 0.06,
  'ideogram-v3-turbo': 0.03,
  'ideogram-v2': 0.08,
  'ideogram-v2-turbo': 0.05,
  'ideogram-v2a-turbo': 0.04,

  // Atlas Cloud - Recraft
  'recraft-v3': 0.04,
  'recraft-v3-svg': 0.08,
  'recraft-20b': 0.022,
  'recraft-20b-svg': 0.044,
  'recraft-crisp-upscale': 0.004,
  'recraft-creative-upscale': 0.25,

  // Atlas Cloud - Wan/Alibaba
  'wan-2.6-t2i': 0.021,
  'wan-2.5-t2i': 0.021,
  'wan-2.1-t2i': 0.02,
  'wan-2.6-i2i': 0.021,
  'wan-2.5-edit': 0.021,
  'wan-2.1-t2i-lora': 0.025,
  'qwen-t2i': 0.02,
  'qwen-image-edit': 0.02,
  'qwen-image-edit-plus': 0.02,

  // Atlas Cloud - Luma
  'photon-t2i': 0.015,
  'photon-flash-t2i': 0.005,
  'photon-modify': 0.015,
  'photon-flash-modify': 0.01,

  // Atlas Cloud - Other
  'hunyuan-image-3': 0.10,
  'neta-lumina': 0.01,
  'hidream-i1-full': 0.024,
  'hidream-i1-dev': 0.012,
  'hidream-e1-full': 0.024,
  'z-image-turbo': 0.0105,
  'z-image-turbo-lora': 0.01,
  'real-esrgan': 0.0024,
  'portrait': 0.02,
  'ghibli': 0.005,
  'instant-character': 0.10,
  'step1x-edit': 0.03,

  // Atlas Cloud - Utilities/Style Transfer
  'image-zoom-out': 0.02,
  'image-watermark-remover': 0.015,
  'plastic-bubble-figure': 0.02,
  'my-world': 0.02,
  'micro-landscape-mini-world': 0.02,
  'glass-ball': 0.02,
  'felt-keychain': 0.02,
  'felt-3d-polaroid': 0.02,
  'advanced-photography': 0.02,
  'american-comic-style': 0.02,

  // Stability AI
  'sd3.5-large': 0.065,
  'sd3.5-medium': 0.035,
  'sd3-large': 0.05,
  'sdxl-1.0': 0.04,

  // FAL.AI
  'flux-pro': 0.05,
  'flux-realism': 0.04,
  'sdxl': 0.03,
  'sdxl-lightning': 0.02,

  // Google Gemini Image
  'gemini-2.5-flash-image': 0.04,
};

/**
 * Video generation pricing (per second)
 */
export const VIDEO_MODEL_PRICING: Record<string, number> = {
  // Featured/Premium tier
  'sora-2-i2v-pro': 0.20,
  'sora-2-i2v': 0.20,
  'sora-2-i2v-pro-dev': 0.15,
  'sora-2-i2v-dev': 0.15,
  'veo3.1-i2v': 0.16,
  'veo3.1-ref-i2v': 0.16,
  'veo3.1-fast-i2v': 0.08,
  'veo3-i2v': 0.16,
  'veo3-fast-i2v': 0.08,
  'veo2-i2v': 0.40,
  'seedance-v1.5-pro-i2v': 0.0823,
  'seedance-v1-pro-fast-i2v': 0.0102,
  'kling-2.6-pro-i2v': 0.0595,
  'kling-video-o1-i2v': 0.476,
  'kling-2.5-turbo-pro-i2v': 0.2975,
  'kling-2.1-start-end-i2v': 0.3825,
  'kling-2.0-master-i2v': 1.105,
  'kling-1.6-multi-pro-i2v': 0.3825,
  'kling-1.6-multi-std-i2v': 0.2125,
  'kling-effects': 0.0425,

  // Standard tier
  'hailuo-2.3-pro-i2v': 0.098,
  'hailuo-2.3-standard-i2v': 0.28,
  'hailuo-2.3-fast-i2v': 0.19,
  'hailuo-02-t2v-pro': 0.096,
  'luma-ray-2-i2v': 0.40,
  'ltx-2-pro-i2v': 0.06,
  'ltx-2-fast-i2v': 0.04,
  'ltx-video-097-i2v': 0.06,
  'vidu-ref-2.0-i2v': 0.20,
  'vidu-ref-q1-i2v': 0.08,
  'vidu-start-end-2.0': 0.06,
  'pika-2.0-turbo-i2v': 0.20,
  'pixverse-4.5-fast-i2v': 0.50,
  'magi-1-24b': 0.32,

  // Budget tier
  'wan-2.6-i2v': 0.07,
  'wan-2.5-i2v': 0.035,
  'wan-2.5-fast-i2v': 0.068,
  'wan-2.2-lora-i2v': 0.04,

  // Video effects
  'video-zoom-out': 0.04,
  'video-shake-dance': 0.06,
  'video-love-drop': 0.04,
  'video-jiggle-up': 0.04,
  'video-fishermen': 0.04,
  'video-flying': 0.04,
  'video-gender-swap': 0.04,
  'video-hulk': 0.06,
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
  V4: 0.04,
  V4_5: 0.05,
  V4_5PLUS: 0.06,
  V4_5ALL: 0.06,
  V5: 0.08,
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
