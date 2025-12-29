/**
 * AI Model Metadata
 * Client-safe metadata about available models (no server-side imports)
 */

// Text Generation Models - Only Google Gemini
export const TEXT_GENERATION_MODELS = {
  'Google Gemini': [
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (1M context)' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Speed optimized)' },
    { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite (Most cost-effective)' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Next-gen)' },
    { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite (Better quality than 1.5)' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Legacy)' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Legacy)' },
  ],
} as const;

// Image Generation Models - Atlas Cloud + Google Gemini
export const IMAGE_GENERATION_MODELS = {
  'Atlas Cloud (Text-to-Image)': [
    { value: 'flux-schnell', label: 'Flux Schnell (Fastest)', supportsReference: false },
    { value: 'flux-dev', label: 'Flux Dev (High Quality)', supportsReference: false },
  ],
  'Atlas Cloud (Image Editing)': [
    { value: 'flux-redux-dev', label: 'Flux Redux Dev', supportsReference: true },
    { value: 'seedream-4.5-edit', label: 'Seedream v4.5 Edit (Best Quality)', supportsReference: true },
    { value: 'seedream-4.5-edit-seq', label: 'Seedream v4.5 Sequential', supportsReference: true },
    { value: 'seedream-4-edit', label: 'Seedream v4 Edit', supportsReference: true },
    { value: 'seedream-4-edit-seq', label: 'Seedream v4 Sequential', supportsReference: true },
    { value: 'nano-banana-pro-edit-ultra', label: 'Nano Banana Pro Ultra', supportsReference: true },
    { value: 'nano-banana-pro-edit', label: 'Nano Banana Pro Edit', supportsReference: true },
    { value: 'nano-banana-pro-edit-dev', label: 'Nano Banana Pro Dev', supportsReference: true },
    { value: 'nano-banana-edit', label: 'Nano Banana Edit', supportsReference: true },
    { value: 'nano-banana-edit-dev', label: 'Nano Banana Edit Dev (Cheapest)', supportsReference: true },
    { value: 'qwen-image-edit', label: 'Qwen Image Edit', supportsReference: true },
    { value: 'qwen-image-edit-plus', label: 'Qwen Image Edit Plus', supportsReference: true },
    { value: 'wan-2.6-i2i', label: 'Wan-2.6 Image Edit', supportsReference: true },
    { value: 'wan-2.5-edit', label: 'Wan-2.5 Image Edit', supportsReference: true },
  ],
  'Atlas Cloud (Upscaling)': [
    { value: 'recraft-crisp-upscale', label: 'Recraft Crisp Upscale', supportsReference: true },
  ],
  'Atlas Cloud (Style Transfer)': [
    { value: 'plastic-bubble-figure', label: 'Plastic Bubble Figure', supportsReference: true },
    { value: 'my-world', label: 'My World', supportsReference: true },
    { value: 'micro-landscape-mini-world', label: 'Micro Landscape Mini World', supportsReference: true },
  ],
  'Google Gemini (Image-to-Image)': [
    { value: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image', supportsReference: true },
  ],
} as const;

// Video Generation Models - AtlasCloud Image-to-Video (Sora removed)
export const VIDEO_GENERATION_MODELS = {
  'Featured': [
    { value: 'seedance-v1.5-pro-i2v', label: 'Seedance v1.5 Pro', description: 'Audio-visual sync, cinematic camera' },
    { value: 'kling-2.6-pro-i2v', label: 'Kling 2.6 Pro', description: 'Sound generation, enhanced dynamics' },
    { value: 'veo3.1-i2v', label: 'Veo 3.1', description: 'High-quality clips, motion-rich' },
    { value: 'veo3.1-fast-i2v', label: 'Veo 3.1 Fast', description: 'Fast previews, iterative' },
  ],
  'Budget Friendly': [
    { value: 'seedance-1-lite', label: 'SeeDance 1 Lite', description: 'Fast generation (default)' },
    { value: 'ltx-2-fast-i2v', label: 'LTX-2 Fast', description: 'Smooth, coherent motion' },
    { value: 'ltx-2-pro-i2v', label: 'LTX-2 Pro', description: 'Longer, higher-res' },
    { value: 'wan-2.6-i2v', label: 'Wan-2.6', description: 'Speed-optimized, good fidelity' },
    { value: 'seedance-v1-pro-fast-i2v', label: 'Seedance v1 Pro Fast', description: 'Cinematic motion, low cost' },
  ],
  'Premium': [
    { value: 'kling-video-o1-i2v', label: 'Kling Video O1', description: 'MVL tech, physics simulation' },
    { value: 'hailuo-2.3-pro-i2v', label: 'Hailuo 2.3 Pro', description: 'Character continuity' },
    { value: 'hailuo-2.3-standard-i2v', label: 'Hailuo 2.3 Standard', description: 'Smooth motion' },
    { value: 'hailuo-2.3-fast', label: 'Hailuo 2.3 Fast', description: 'Rapid generation' },
    { value: 'veo3.1-ref-i2v', label: 'Veo 3.1 Reference', description: 'Subject consistency' },
  ],
} as const;

/**
 * Get all available text generation models
 * Safe to call from client components
 */
export function getAvailableTextModels() {
  return TEXT_GENERATION_MODELS;
}

/**
 * Get all available image generation models
 * Safe to call from client components
 */
export function getAvailableImageModels() {
  return IMAGE_GENERATION_MODELS;
}

/**
 * Get all available video generation models
 * Safe to call from client components
 */
export function getAvailableVideoModels() {
  return VIDEO_GENERATION_MODELS;
}

/**
 * Get image models filtered by reference support
 * @param requiresReference - if true, only return models that support reference images
 */
export function getFilteredImageModels(requiresReference: boolean) {
  const result: Record<string, Array<{ value: string; label: string; supportsReference: boolean }>> = {};

  for (const [provider, models] of Object.entries(IMAGE_GENERATION_MODELS)) {
    const filtered = models.filter(m => !requiresReference || m.supportsReference);
    if (filtered.length > 0) {
      result[provider] = filtered as Array<{ value: string; label: string; supportsReference: boolean }>;
    }
  }

  return result;
}

/**
 * Get flat list of all image models
 */
export function getAllImageModelsFlat() {
  const models: Array<{ value: string; label: string; supportsReference: boolean; provider: string }> = [];

  for (const [provider, providerModels] of Object.entries(IMAGE_GENERATION_MODELS)) {
    for (const model of providerModels) {
      models.push({ ...model, provider });
    }
  }

  return models;
}

/**
 * Get flat list of all video models
 */
export function getAllVideoModelsFlat() {
  const models: Array<{ value: string; label: string; description?: string; provider: string }> = [];

  for (const [provider, providerModels] of Object.entries(VIDEO_GENERATION_MODELS)) {
    for (const model of providerModels) {
      models.push({ ...model, provider });
    }
  }

  return models;
}

/**
 * Map internal video model ID to AtlasCloud API model string
 */
export function getAtlasCloudVideoModelId(internalId: string): string {
  const modelMapping: Record<string, string> = {
    // Featured
    'seedance-v1.5-pro-i2v': 'bytedance/seedance-v1.5-pro/image-to-video',
    'kling-2.6-pro-i2v': 'kuaishou/kling-2.6-pro/image-to-video',
    'veo3.1-i2v': 'google/veo3.1/image-to-video',
    'veo3.1-fast-i2v': 'google/veo3.1-fast/image-to-video',
    // Budget
    'seedance-1-lite': 'bytedance/seedance-1-lite/image-to-video',
    'ltx-2-fast-i2v': 'lightricks/ltx-2-fast/image-to-video',
    'ltx-2-pro-i2v': 'lightricks/ltx-2-pro/image-to-video',
    'wan-2.6-i2v': 'alibaba/wan-2.6/image-to-video',
    'seedance-v1-pro-fast-i2v': 'bytedance/seedance-v1-pro-fast/image-to-video',
    // Premium
    'kling-video-o1-i2v': 'kuaishou/kling-video-o1/image-to-video',
    'hailuo-2.3-pro-i2v': 'minimax/hailuo-2.3-pro/image-to-video',
    'hailuo-2.3-standard-i2v': 'minimax/hailuo-2.3-standard/image-to-video',
    'hailuo-2.3-fast': 'minimax/hailuo-2.3-fast/image-to-video',
    'veo3.1-ref-i2v': 'google/veo3.1-ref/image-to-video',
  };

  return modelMapping[internalId] || internalId;
}
