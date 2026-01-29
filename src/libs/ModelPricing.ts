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
  'flux-dev-ultra-fast': 0.02,
  'flux-dev-lora': 0.025,
  'flux-dev-lora-ultra-fast': 0.02,
  'flux-schnell-lora': 0.003,
  'flux-1.1-pro-ultra': 0.06,
  'flux-1.1-pro': 0.04,
  'flux-2-flex-t2i': 0.025,
  'flux-kontext-max': 0.08,
  'flux-kontext-max-t2i': 0.08,
  'flux-kontext-pro': 0.05,
  'flux-kontext-pro-t2i': 0.05,
  'flux-kontext-dev': 0.025,
  'flux-kontext-dev-ultra-fast': 0.02,
  'flux-kontext-dev-lora': 0.025,
  'flux-kontext-dev-lora-ultra-fast': 0.02,
  'flux-kontext-max-multi': 0.08,
  'flux-kontext-pro-multi': 0.05,
  'flux-kontext-dev-multi': 0.025,
  'flux-kontext-dev-multi-ultra-fast': 0.02,
  'flux-redux-dev': 0.025,
  'flux-redux-pro': 0.04,
  'flux-2-dev-edit': 0.03,
  'flux-2-pro-edit': 0.05,
  'flux-2-flex-edit': 0.025,
  'flux-krea-dev-lora': 0.025,
  'flux-krea-dev-lora-t2i': 0.025,
  'flux-fill-dev': 0.025,
  'flux-controlnet-pro': 0.04,

  // Atlas Cloud - Seedream/ByteDance
  'seedream-4.5-t2i': 0.03,
  'seedream-4.5-seq-t2i': 0.03,
  'seedream-4-t2i': 0.025,
  'seedream-4-seq-t2i': 0.025,
  'seedream-3.1-t2i': 0.02,
  'seedream-3-t2i': 0.02,
  'seedream-4.5-edit': 0.035,
  'seedream-4.5-edit-seq': 0.035,
  'seedream-4-edit': 0.03,
  'seedream-4-edit-seq': 0.03,
  'seededit-v3': 0.025,

  // Atlas Cloud - Google Imagen
  'imagen4-ultra': 0.08,
  'imagen4': 0.04,
  'imagen4-fast': 0.02,
  'atlascloud-imagen4': 0.04,
  'imagen3': 0.035,
  'imagen3-fast': 0.02,

  // Atlas Cloud - Nano Banana/Gemini
  'nano-banana-pro-t2i-ultra': 0.06,
  'nano-banana-pro-t2i': 0.04,
  'nano-banana-pro-t2i-dev': 0.025,
  'nano-banana-t2i': 0.02,
  'nano-banana-t2i-dev': 0.015,
  'gemini-2.5-flash-t2i': 0.03,
  'gemini-2.5-flash-t2i-dev': 0.02,
  'nano-banana-pro-edit-ultra': 0.06,
  'nano-banana-pro-edit': 0.04,
  'nano-banana-pro-edit-dev': 0.025,
  'nano-banana-edit-dev': 0.015,
  'nano-banana-edit': 0.02,

  // Atlas Cloud - Ideogram
  'ideogram-v3-quality': 0.08,
  'ideogram-v3-balanced': 0.05,
  'ideogram-v3-turbo': 0.03,
  'ideogram-v2': 0.04,
  'ideogram-v2-turbo': 0.025,
  'ideogram-v2a-turbo': 0.025,

  // Atlas Cloud - Recraft
  'recraft-v3': 0.04,
  'recraft-v3-svg': 0.05,
  'recraft-20b': 0.03,
  'recraft-20b-svg': 0.04,
  'recraft-crisp-upscale': 0.02,
  'recraft-creative-upscale': 0.025,

  // Atlas Cloud - Wan/Alibaba
  'wan-2.6-t2i': 0.025,
  'wan-2.5-t2i': 0.02,
  'wan-2.1-t2i': 0.015,
  'wan-2.6-i2i': 0.03,
  'wan-2.5-edit': 0.025,
  'wan-2.1-t2i-lora': 0.02,
  'qwen-t2i': 0.025,
  'qwen-image-edit': 0.03,
  'qwen-image-edit-plus': 0.035,

  // Atlas Cloud - Luma
  'photon-t2i': 0.04,
  'photon-flash-t2i': 0.02,
  'photon-modify': 0.045,
  'photon-flash-modify': 0.025,

  // Atlas Cloud - Other
  'hunyuan-image-3': 0.03,
  'neta-lumina': 0.025,
  'hidream-i1-full': 0.035,
  'hidream-i1-dev': 0.02,
  'hidream-e1-full': 0.04,
  'z-image-turbo': 0.015,
  'z-image-turbo-lora': 0.02,
  'real-esrgan': 0.01,
  'portrait': 0.025,
  'ghibli': 0.03,
  'instant-character': 0.035,
  'step1x-edit': 0.025,

  // Atlas Cloud - Utilities/Style Transfer
  'image-zoom-out': 0.01,
  'image-watermark-remover': 0.01,
  'plastic-bubble-figure': 0.02,
  'my-world': 0.02,
  'micro-landscape-mini-world': 0.02,
  'glass-ball': 0.02,
  'felt-keychain': 0.02,
  'felt-3d-polaroid': 0.02,
  'advanced-photography': 0.025,
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
  'sora-2-i2v-pro': 0.50,
  'sora-2-i2v': 0.30,
  'sora-2-i2v-pro-dev': 0.25,
  'sora-2-i2v-dev': 0.15,
  'veo3.1-i2v': 0.40,
  'veo3.1-ref-i2v': 0.45,
  'veo3.1-fast-i2v': 0.20,
  'veo3-i2v': 0.35,
  'veo3-fast-i2v': 0.18,
  'veo2-i2v': 0.25,
  'seedance-v1.5-pro-i2v': 0.15,
  'seedance-v1-pro-fast-i2v': 0.08,
  'kling-2.6-pro-i2v': 0.20,
  'kling-video-o1-i2v': 0.25,
  'kling-2.5-turbo-pro-i2v': 0.15,
  'kling-2.1-start-end-i2v': 0.12,
  'kling-2.0-master-i2v': 0.18,
  'kling-1.6-multi-pro-i2v': 0.10,
  'kling-1.6-multi-std-i2v': 0.06,
  'kling-effects': 0.05,

  // Standard tier
  'hailuo-2.3-pro-i2v': 0.12,
  'hailuo-2.3-standard-i2v': 0.08,
  'hailuo-2.3-fast-i2v': 0.04,
  'hailuo-02-t2v-pro': 0.10,
  'luma-ray-2-i2v': 0.15,
  'ltx-2-pro-i2v': 0.08,
  'ltx-2-fast-i2v': 0.03,
  'ltx-video-097-i2v': 0.025,
  'vidu-ref-2.0-i2v': 0.12,
  'vidu-ref-q1-i2v': 0.10,
  'vidu-start-end-2.0': 0.08,
  'pika-2.0-turbo-i2v': 0.06,
  'pixverse-4.5-fast-i2v': 0.05,
  'magi-1-24b': 0.06,

  // Budget tier
  'wan-2.6-i2v': 0.04,
  'wan-2.5-i2v': 0.035,
  'wan-2.5-fast-i2v': 0.02,
  'wan-2.2-lora-i2v': 0.03,

  // Video effects
  'video-zoom-out': 0.02,
  'video-shake-dance': 0.02,
  'video-love-drop': 0.02,
  'video-jiggle-up': 0.02,
  'video-fishermen': 0.02,
  'video-flying': 0.02,
  'video-gender-swap': 0.03,
  'video-hulk': 0.02,
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
