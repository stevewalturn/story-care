/**
 * AI Model Metadata
 * Client-safe metadata about available models (no server-side imports)
 */

// Text Generation Models
export const TEXT_GENERATION_MODELS = {
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
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Speed optimized)' },
    { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite (Most cost-effective)' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Next-gen)' },
    { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite (Better quality than 1.5)' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Legacy)' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Legacy)' },
  ],
} as const;

// Image Generation Models
export const IMAGE_GENERATION_MODELS = {
  'Atlas Cloud (Flux)': [
    { value: 'flux-schnell', label: 'Flux Schnell (Fastest) - $0.0024/pic' },
    { value: 'flux-dev', label: 'Flux Dev (High Quality) - $0.0096/pic' },
  ],
  'Google Gemini (Image-to-Image)': [
    { value: 'gemini-2.5-flash-image', label: 'Nano Banana (Gemini 2.5 Flash Image) - HOT' },
  ],
  'Stability AI': [
    { value: 'sd3.5-large', label: 'Stable Diffusion 3.5 Large' },
    { value: 'sd3.5-medium', label: 'Stable Diffusion 3.5 Medium' },
    { value: 'sd3-large', label: 'Stable Diffusion 3 Large' },
    { value: 'sdxl-1.0', label: 'Stable Diffusion XL 1.0' },
  ],
  'FAL.AI': [
    { value: 'flux-pro', label: 'Flux Pro' },
    { value: 'flux-realism', label: 'Flux Realism' },
    { value: 'sdxl', label: 'Fast SDXL' },
    { value: 'sdxl-lightning', label: 'SDXL Lightning' },
  ],
} as const;

// Video Generation Models
export const VIDEO_GENERATION_MODELS = {
  'Atlas Cloud': [
    { value: 'seedance-1-lite', label: 'SeeDance 1 Lite (Fast generation)' },
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
