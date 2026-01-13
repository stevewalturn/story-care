/**
 * Atlas Cloud AI Generation Provider
 * Supports: Flux image models and video generation
 * Documentation: https://docs.atlascloud.ai/
 */

export type AtlasImageModel
  // Text-to-Image (Flux)
  = | 'flux-schnell'
    | 'flux-dev'
    | 'flux-2-flex-t2i'
    | 'flux-1.1-pro-ultra'
    | 'flux-1.1-pro'
    | 'flux-kontext-max-t2i'
    | 'flux-kontext-pro-t2i'
    | 'flux-dev-ultra-fast'
    | 'flux-dev-lora'
    | 'flux-dev-lora-ultra-fast'
    | 'flux-schnell-lora'
    | 'flux-krea-dev-lora-t2i'
  // Text-to-Image (Seedream)
    | 'seedream-4.5-t2i'
    | 'seedream-4.5-seq-t2i'
    | 'seedream-4-t2i'
    | 'seedream-4-seq-t2i'
    | 'seedream-3.1-t2i'
    | 'seedream-3-t2i'
  // Text-to-Image (Imagen)
    | 'imagen4-ultra'
    | 'imagen4'
    | 'imagen4-fast'
    | 'atlascloud-imagen4'
    | 'imagen3'
    | 'imagen3-fast'
  // Text-to-Image (Nano Banana/Gemini)
    | 'nano-banana-pro-t2i-ultra'
    | 'nano-banana-pro-t2i'
    | 'nano-banana-pro-t2i-dev'
    | 'nano-banana-t2i'
    | 'nano-banana-t2i-dev'
    | 'gemini-2.5-flash-t2i'
    | 'gemini-2.5-flash-t2i-dev'
  // Text-to-Image (Ideogram)
    | 'ideogram-v3-quality'
    | 'ideogram-v3-balanced'
    | 'ideogram-v3-turbo'
    | 'ideogram-v2'
    | 'ideogram-v2-turbo'
    | 'ideogram-v2a-turbo'
  // Text-to-Image (Recraft)
    | 'recraft-v3'
    | 'recraft-v3-svg'
    | 'recraft-20b'
    | 'recraft-20b-svg'
  // Text-to-Image (Wan)
    | 'wan-2.6-t2i'
    | 'wan-2.5-t2i'
    | 'wan-2.1-t2i'
  // Text-to-Image (Luma)
    | 'photon-t2i'
    | 'photon-flash-t2i'
  // Text-to-Image (AtlasCloud)
    | 'hunyuan-image-3'
    | 'neta-lumina'
    | 'qwen-t2i'
    | 'hidream-i1-full'
    | 'hidream-i1-dev'
  // Text-to-Image (Z-Image)
    | 'z-image-turbo'
    | 'z-image-turbo-lora'
  // Image-to-Image (Flux Redux)
    | 'flux-redux-dev'
    | 'flux-redux-pro'
  // Image-to-Image (Flux 2 Edit)
    | 'flux-2-dev-edit'
    | 'flux-2-pro-edit'
    | 'flux-2-flex-edit'
  // Image-to-Image (Flux Kontext - Single)
    | 'flux-kontext-max'
    | 'flux-kontext-pro'
    | 'flux-kontext-dev'
    | 'flux-kontext-dev-ultra-fast'
    | 'flux-kontext-dev-lora'
    | 'flux-kontext-dev-lora-ultra-fast'
  // Image-to-Image (Flux Kontext - Multi)
    | 'flux-kontext-max-multi'
    | 'flux-kontext-pro-multi'
    | 'flux-kontext-dev-multi'
    | 'flux-kontext-dev-multi-ultra-fast'
  // Image-to-Image (Flux Special)
    | 'flux-krea-dev-lora'
    | 'flux-fill-dev'
    | 'flux-controlnet-pro'
  // Image-to-Image (Alibaba/Qwen)
    | 'wan-2.6-i2i'
    | 'wan-2.5-edit'
    | 'wan-2.1-t2i-lora'
    | 'qwen-image-edit'
    | 'qwen-image-edit-plus'
  // Image-to-Image (ByteDance/Seedream)
    | 'seedream-4.5-edit'
    | 'seedream-4.5-edit-seq'
    | 'seedream-4-edit'
    | 'seedream-4-edit-seq'
    | 'seededit-v3'
    | 'portrait'
  // Image-to-Image (Google/Nano Banana)
    | 'nano-banana-pro-edit-ultra'
    | 'nano-banana-pro-edit'
    | 'nano-banana-pro-edit-dev'
    | 'nano-banana-edit-dev'
    | 'nano-banana-edit'
  // Image-to-Image (Luma)
    | 'photon-modify'
    | 'photon-flash-modify'
  // Image-to-Image (AtlasCloud)
    | 'ghibli'
    | 'instant-character'
    | 'hidream-e1-full'
    | 'step1x-edit'
  // Upscaling
    | 'recraft-crisp-upscale'
    | 'recraft-creative-upscale'
    | 'real-esrgan'
  // Utilities (No Prompt)
    | 'image-zoom-out'
    | 'image-watermark-remover'
  // Style Transfer
    | 'plastic-bubble-figure'
    | 'my-world'
    | 'micro-landscape-mini-world'
    | 'glass-ball'
    | 'felt-keychain'
    | 'felt-3d-polaroid'
    | 'advanced-photography'
    | 'american-comic-style';

export type AtlasVideoModel
  // Featured
  = | 'sora-2-i2v-pro'
    | 'sora-2-i2v'
    | 'veo3.1-i2v'
    | 'veo3-i2v'
    | 'seedance-v1.5-pro-i2v'
    | 'kling-2.6-pro-i2v'
  // Premium
    | 'kling-video-o1-i2v'
    | 'veo3.1-ref-i2v'
    | 'veo2-i2v'
    | 'kling-2.5-turbo-pro-i2v'
    | 'kling-2.1-start-end-i2v'
    | 'kling-2.0-master-i2v'
    | 'hailuo-2.3-pro-i2v'
    | 'luma-ray-2-i2v'
    | 'vidu-ref-2.0-i2v'
    | 'vidu-ref-q1-i2v'
  // Standard
    | 'sora-2-i2v-pro-dev'
    | 'sora-2-i2v-dev'
    | 'veo3.1-fast-i2v'
    | 'veo3-fast-i2v'
    | 'hailuo-2.3-standard-i2v'
    | 'hailuo-02-t2v-pro'
    | 'kling-1.6-multi-pro-i2v'
    | 'kling-1.6-multi-std-i2v'
    | 'ltx-2-pro-i2v'
    | 'vidu-start-end-2.0'
    | 'pika-2.0-turbo-i2v'
    | 'pixverse-4.5-fast-i2v'
    | 'magi-1-24b'
  // Budget
    | 'wan-2.6-i2v'
    | 'wan-2.5-i2v'
    | 'wan-2.5-fast-i2v'
    | 'wan-2.2-lora-i2v'
    | 'ltx-2-fast-i2v'
    | 'ltx-video-097-i2v'
    | 'seedance-v1-pro-fast-i2v'
    | 'hailuo-2.3-fast-i2v'
    | 'kling-effects'
  // Video Effects
    | 'video-zoom-out'
    | 'video-shake-dance'
    | 'video-love-drop'
    | 'video-jiggle-up'
    | 'video-fishermen'
    | 'video-flying'
    | 'video-gender-swap'
    | 'video-hulk';

/**
 * Model configuration with specific requirements
 */
type ModelConfig = {
  atlasName: string;
  minSize: string;
  defaultSteps: number;
  requiresImage: boolean;
  imageField: 'image' | 'images' | null;
  category: 'text-to-image' | 'image-editing' | 'upscaling' | 'style-transfer';
  /** Higher guidance = follow prompt more, lower = stay closer to reference image */
  defaultGuidanceScale: number;
  /** Maximum number of reference images supported (1 for 'image' field, 4+ for 'images' field) */
  maxReferenceImages: number;
  /** Whether this model uses the prompt input (false for upscaling, style transfer, image variation) */
  supportsPrompt: boolean;
};

/**
 * Per-model configuration for Atlas Cloud
 * Defines size requirements, image field names, and other model-specific settings
 */
const MODEL_CONFIGS: Record<AtlasImageModel, ModelConfig> = {
  // Text-to-Image models (no reference image required)
  'flux-schnell': {
    atlasName: 'black-forest-labs/flux-schnell',
    minSize: '1024*1024',
    defaultSteps: 4,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 3.5,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'flux-dev': {
    atlasName: 'black-forest-labs/flux-dev',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 3.5,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },

  // Flux Redux (singular 'image' field) - Image variation model
  'flux-redux-dev': {
    atlasName: 'black-forest-labs/flux-redux-dev',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image',
    category: 'image-editing',
    defaultGuidanceScale: 7.5,
    maxReferenceImages: 1,
    supportsPrompt: false, // Image variation model - no prompt support
  },
  'flux-redux-pro': {
    atlasName: 'black-forest-labs/flux-redux-pro',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image',
    category: 'image-editing',
    defaultGuidanceScale: 3.5,
    maxReferenceImages: 1,
    supportsPrompt: true, // Pro version supports prompt
  },

  // Flux 2 Edit models (uses 'images' array)
  'flux-2-flex-t2i': {
    atlasName: 'black-forest-labs/flux-2-flex/text-to-image',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 3.5,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'flux-1.1-pro-ultra': {
    atlasName: 'black-forest-labs/flux-1.1-pro-ultra',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 3.5,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'flux-1.1-pro': {
    atlasName: 'black-forest-labs/flux-1.1-pro',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 3.5,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'flux-kontext-max-t2i': {
    atlasName: 'black-forest-labs/flux-kontext-max/text-to-image',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 3.5,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'flux-kontext-pro-t2i': {
    atlasName: 'black-forest-labs/flux-kontext-pro/text-to-image',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 3.5,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'flux-dev-ultra-fast': {
    atlasName: 'black-forest-labs/flux-dev-ultra-fast',
    minSize: '1024*1024',
    defaultSteps: 12,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 3.5,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'flux-dev-lora': {
    atlasName: 'black-forest-labs/flux-dev-lora',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 3.5,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'flux-dev-lora-ultra-fast': {
    atlasName: 'black-forest-labs/flux-dev-lora-ultra-fast',
    minSize: '1024*1024',
    defaultSteps: 12,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 3.5,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'flux-schnell-lora': {
    atlasName: 'black-forest-labs/flux-schnell-lora',
    minSize: '1024*1024',
    defaultSteps: 4,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 3.5,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'flux-krea-dev-lora-t2i': {
    atlasName: 'black-forest-labs/flux-krea-dev-lora',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 3.5,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },

  // Text-to-Image (Seedream/ByteDance) - uses 2048*2048 per TEXT_TO_IMAGE.md
  'seedream-4.5-t2i': {
    atlasName: 'bytedance/seedream-v4.5',
    minSize: '2048*2048', // Per TEXT_TO_IMAGE.md
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 5.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'seedream-4.5-seq-t2i': {
    atlasName: 'bytedance/seedream-v4.5/sequential',
    minSize: '2048*2048', // Per TEXT_TO_IMAGE.md
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 5.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'seedream-4-t2i': {
    atlasName: 'bytedance/seedream-v4',
    minSize: '2048*2048', // Per TEXT_TO_IMAGE.md
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 5.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'seedream-4-seq-t2i': {
    atlasName: 'bytedance/seedream-v4/sequential',
    minSize: '2048*2048', // Per TEXT_TO_IMAGE.md
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 5.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'seedream-3.1-t2i': {
    atlasName: 'bytedance/seedream-v3.1',
    minSize: '1024*1024', // Per TEXT_TO_IMAGE.md
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 5.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'seedream-3-t2i': {
    atlasName: 'bytedance/seedream-v3',
    minSize: '1024*1024', // Per TEXT_TO_IMAGE.md
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 5.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },

  // Text-to-Image (Imagen/Google)
  'imagen4-ultra': {
    atlasName: 'google/imagen4-ultra',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 7.5,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'imagen4': {
    atlasName: 'google/imagen4',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 7.5,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'imagen4-fast': {
    atlasName: 'google/imagen4-fast',
    minSize: '1024*1024',
    defaultSteps: 12,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 7.5,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'atlascloud-imagen4': {
    atlasName: 'atlascloud/imagen4',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 7.5,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'imagen3': {
    atlasName: 'google/imagen3',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 7.5,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'imagen3-fast': {
    atlasName: 'google/imagen3-fast',
    minSize: '1024*1024',
    defaultSteps: 12,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 7.5,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },

  // Text-to-Image (Nano Banana/Gemini)
  'nano-banana-pro-t2i-ultra': {
    atlasName: 'google/nano-banana-pro/text-to-image-ultra',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 6.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'nano-banana-pro-t2i': {
    atlasName: 'google/nano-banana-pro/text-to-image',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 6.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'nano-banana-pro-t2i-dev': {
    atlasName: 'google/nano-banana-pro/text-to-image-developer',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 6.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'nano-banana-t2i': {
    atlasName: 'google/nano-banana/text-to-image',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 6.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'nano-banana-t2i-dev': {
    atlasName: 'google/nano-banana/text-to-image-developer',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 6.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'gemini-2.5-flash-t2i': {
    atlasName: 'google/gemini-2.5-flash-image/text-to-image',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 6.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'gemini-2.5-flash-t2i-dev': {
    atlasName: 'google/gemini-2.5-flash-image/text-to-image-developer',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 6.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },

  // Text-to-Image (Ideogram)
  'ideogram-v3-quality': {
    atlasName: 'ideogram-ai/ideogram-v3-quality',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 7.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'ideogram-v3-balanced': {
    atlasName: 'ideogram-ai/ideogram-v3-balanced',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 7.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'ideogram-v3-turbo': {
    atlasName: 'ideogram-ai/ideogram-v3-turbo',
    minSize: '1024*1024',
    defaultSteps: 12,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 7.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'ideogram-v2': {
    atlasName: 'ideogram-ai/ideogram-v2',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 7.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'ideogram-v2-turbo': {
    atlasName: 'ideogram-ai/ideogram-v2-turbo',
    minSize: '1024*1024',
    defaultSteps: 12,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 7.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'ideogram-v2a-turbo': {
    atlasName: 'ideogram-ai/ideogram-v2a-turbo',
    minSize: '1024*1024',
    defaultSteps: 12,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 7.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },

  // Text-to-Image (Recraft)
  'recraft-v3': {
    atlasName: 'recraft-ai/recraft-v3',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 7.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'recraft-v3-svg': {
    atlasName: 'recraft-ai/recraft-v3-svg',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 7.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'recraft-20b': {
    atlasName: 'recraft-ai/recraft-20b',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 7.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'recraft-20b-svg': {
    atlasName: 'recraft-ai/recraft-20b-svg',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 7.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },

  // Text-to-Image (Wan/Alibaba) - uses 1280*1280 per TEXT_TO_IMAGE.md
  'wan-2.6-t2i': {
    atlasName: 'alibaba/wan-2.6/text-to-image',
    minSize: '1280*1280', // Per TEXT_TO_IMAGE.md
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 5.5,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'wan-2.5-t2i': {
    atlasName: 'alibaba/wan-2.5/text-to-image',
    minSize: '1280*1280', // Per TEXT_TO_IMAGE.md
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 5.5,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'wan-2.1-t2i': {
    atlasName: 'alibaba/wan-2.1/text-to-image',
    minSize: '1024*1024', // Per TEXT_TO_IMAGE.md (different from 2.5/2.6)
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 5.5,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },

  // Text-to-Image (Luma)
  'photon-t2i': {
    atlasName: 'luma/photon',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 5.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'photon-flash-t2i': {
    atlasName: 'luma/photon-flash',
    minSize: '1024*1024',
    defaultSteps: 12,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 5.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },

  // Text-to-Image (AtlasCloud)
  'hunyuan-image-3': {
    atlasName: 'atlascloud/hunyuan-image-3',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 5.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'neta-lumina': {
    atlasName: 'atlascloud/neta-lumina',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 5.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'qwen-t2i': {
    atlasName: 'atlascloud/qwen-image/text-to-image',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 5.5,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'hidream-i1-full': {
    atlasName: 'atlascloud/hidream-i1-full',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 5.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'hidream-i1-dev': {
    atlasName: 'atlascloud/hidream-i1-dev',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 5.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },

  // Text-to-Image (Z-Image)
  'z-image-turbo': {
    atlasName: 'z-image/turbo',
    minSize: '1024*1024',
    defaultSteps: 12,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 5.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },
  'z-image-turbo-lora': {
    atlasName: 'z-image/turbo-lora',
    minSize: '1024*1024',
    defaultSteps: 12,
    requiresImage: false,
    imageField: null,
    category: 'text-to-image',
    defaultGuidanceScale: 5.0,
    maxReferenceImages: 0,
    supportsPrompt: true,
  },

  'flux-2-dev-edit': {
    atlasName: 'black-forest-labs/flux-2-dev/edit',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'image-editing',
    defaultGuidanceScale: 5.0,
    maxReferenceImages: 4,
    supportsPrompt: true,
  },
  'flux-2-pro-edit': {
    atlasName: 'black-forest-labs/flux-2-pro/edit',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'image-editing',
    defaultGuidanceScale: 5.0,
    maxReferenceImages: 4,
    supportsPrompt: true,
  },
  'flux-2-flex-edit': {
    atlasName: 'black-forest-labs/flux-2-flex/edit',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'image-editing',
    defaultGuidanceScale: 5.0,
    maxReferenceImages: 4,
    supportsPrompt: true,
  },

  // Flux Kontext models (singular 'image' field)
  'flux-kontext-max': {
    atlasName: 'black-forest-labs/flux-kontext-max',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image',
    category: 'image-editing',
    defaultGuidanceScale: 3.5,
    maxReferenceImages: 1,
    supportsPrompt: true,
  },
  'flux-kontext-pro': {
    atlasName: 'black-forest-labs/flux-kontext-pro',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image',
    category: 'image-editing',
    defaultGuidanceScale: 3.5,
    maxReferenceImages: 1,
    supportsPrompt: true,
  },
  'flux-kontext-dev': {
    atlasName: 'black-forest-labs/flux-kontext-dev',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image',
    category: 'image-editing',
    defaultGuidanceScale: 2.5,
    maxReferenceImages: 1,
    supportsPrompt: true,
  },
  'flux-kontext-dev-ultra-fast': {
    atlasName: 'black-forest-labs/flux-kontext-dev-ultra-fast',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image',
    category: 'image-editing',
    defaultGuidanceScale: 2.5,
    maxReferenceImages: 1,
    supportsPrompt: true,
  },
  'flux-kontext-dev-lora': {
    atlasName: 'black-forest-labs/flux-kontext-dev-lora',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image',
    category: 'image-editing',
    defaultGuidanceScale: 2.5,
    maxReferenceImages: 1,
    supportsPrompt: true,
  },
  'flux-kontext-dev-lora-ultra-fast': {
    atlasName: 'black-forest-labs/flux-kontext-dev-lora-ultra-fast',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image',
    category: 'image-editing',
    defaultGuidanceScale: 2.5,
    maxReferenceImages: 1,
    supportsPrompt: true,
  },

  // Flux Kontext Multi models (uses 'images' array)
  'flux-kontext-max-multi': {
    atlasName: 'black-forest-labs/flux-kontext-max/multi',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'image-editing',
    defaultGuidanceScale: 3.5,
    maxReferenceImages: 4,
    supportsPrompt: true,
  },
  'flux-kontext-pro-multi': {
    atlasName: 'black-forest-labs/flux-kontext-pro/multi',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'image-editing',
    defaultGuidanceScale: 3.5,
    maxReferenceImages: 4,
    supportsPrompt: true,
  },
  'flux-kontext-dev-multi': {
    atlasName: 'black-forest-labs/flux-kontext-dev/multi',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'image-editing',
    defaultGuidanceScale: 2.5,
    maxReferenceImages: 4,
    supportsPrompt: true,
  },
  'flux-kontext-dev-multi-ultra-fast': {
    atlasName: 'black-forest-labs/flux-kontext-dev/multi-ultra-fast',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'image-editing',
    defaultGuidanceScale: 2.5,
    maxReferenceImages: 4,
    supportsPrompt: true,
  },

  // Flux Special models
  'flux-krea-dev-lora': {
    atlasName: 'black-forest-labs/flux-krea-dev-lora',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image',
    category: 'image-editing',
    defaultGuidanceScale: 3.5,
    maxReferenceImages: 1,
    supportsPrompt: true,
  },
  'flux-fill-dev': {
    atlasName: 'black-forest-labs/flux-fill-dev',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image', // Also requires mask_image - special handling needed
    category: 'image-editing',
    defaultGuidanceScale: 30,
    maxReferenceImages: 1,
    supportsPrompt: true,
  },
  'flux-controlnet-pro': {
    atlasName: 'black-forest-labs/flux-controlnet-union-pro-2.0',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image', // Uses control_image - special handling needed
    category: 'image-editing',
    defaultGuidanceScale: 3.5,
    maxReferenceImages: 1,
    supportsPrompt: true,
  },

  // Seedream models - require larger images (1920x1920 = 3,686,400 pixels)
  'seedream-4.5-edit': {
    atlasName: 'bytedance/seedream-v4.5/edit',
    minSize: '1920*1920',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'image-editing',
    defaultGuidanceScale: 5.0, // Balanced: preserve features + follow prompt
    maxReferenceImages: 4,
    supportsPrompt: true,
  },
  'seedream-4.5-edit-seq': {
    atlasName: 'bytedance/seedream-v4.5/edit-sequential',
    minSize: '1920*1920',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'image-editing',
    defaultGuidanceScale: 5.0,
    maxReferenceImages: 4,
    supportsPrompt: true,
  },
  'seedream-4-edit': {
    atlasName: 'bytedance/seedream-v4/edit',
    minSize: '1920*1920',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'image-editing',
    defaultGuidanceScale: 5.0,
    maxReferenceImages: 4,
    supportsPrompt: true,
  },
  'seedream-4-edit-seq': {
    atlasName: 'bytedance/seedream-v4/edit-sequential',
    minSize: '1920*1920',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'image-editing',
    defaultGuidanceScale: 5.0,
    maxReferenceImages: 4,
    supportsPrompt: true,
  },
  'seededit-v3': {
    atlasName: 'bytedance/seededit-v3',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image',
    category: 'image-editing',
    defaultGuidanceScale: 0.5, // Per API contract
    maxReferenceImages: 1,
    supportsPrompt: true,
  },
  'portrait': {
    atlasName: 'bytedance/portrait',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image',
    category: 'image-editing',
    defaultGuidanceScale: 5.0,
    maxReferenceImages: 1,
    supportsPrompt: true,
  },

  // Nano Banana models
  'nano-banana-pro-edit-ultra': {
    atlasName: 'google/nano-banana-pro/edit-ultra',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'image-editing',
    defaultGuidanceScale: 6.0, // Balanced editing
    maxReferenceImages: 4,
    supportsPrompt: true,
  },
  'nano-banana-pro-edit': {
    atlasName: 'google/nano-banana-pro/edit',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'image-editing',
    defaultGuidanceScale: 6.0,
    maxReferenceImages: 4,
    supportsPrompt: true,
  },
  'nano-banana-pro-edit-dev': {
    atlasName: 'google/nano-banana-pro/edit-developer',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'image-editing',
    defaultGuidanceScale: 6.0,
    maxReferenceImages: 4,
    supportsPrompt: true,
  },
  'nano-banana-edit-dev': {
    atlasName: 'google/nano-banana/edit-developer',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'image-editing',
    defaultGuidanceScale: 6.0,
    maxReferenceImages: 4,
    supportsPrompt: true,
  },
  'nano-banana-edit': {
    atlasName: 'google/nano-banana/edit',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images',
    category: 'image-editing',
    defaultGuidanceScale: 6.0,
    maxReferenceImages: 4,
    supportsPrompt: true,
  },

  // Qwen models (atlascloud namespace per API contract)
  'qwen-image-edit': {
    atlasName: 'atlascloud/qwen-image/edit',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image', // Singular per API contract
    category: 'image-editing',
    defaultGuidanceScale: 5.5, // Good for text-based edits
    maxReferenceImages: 1, // Single image only per API
    supportsPrompt: true,
  },
  'qwen-image-edit-plus': {
    atlasName: 'atlascloud/qwen-image/edit-plus',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images', // Array (1-3 images) per API
    category: 'image-editing',
    defaultGuidanceScale: 5.5,
    maxReferenceImages: 3, // Per API: 1-3 reference images
    supportsPrompt: true,
  },
  // Wan models - use 'images' array per API contract
  'wan-2.6-i2i': {
    atlasName: 'alibaba/wan-2.6/image-edit', // Fixed: was image-to-image
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images', // Fixed: uses images array per API contract
    category: 'image-editing',
    defaultGuidanceScale: 5.5,
    maxReferenceImages: 4, // Fixed: supports multiple images
    supportsPrompt: true,
  },
  'wan-2.5-edit': {
    atlasName: 'alibaba/wan-2.5/image-edit',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'images', // Fixed: uses images array per API contract
    category: 'image-editing',
    defaultGuidanceScale: 5.5,
    maxReferenceImages: 4, // Fixed: supports multiple images
    supportsPrompt: true,
  },
  'wan-2.1-t2i-lora': {
    atlasName: 'alibaba/wan-2.1/text-to-image-lora',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image',
    category: 'image-editing',
    defaultGuidanceScale: 5.5,
    maxReferenceImages: 1,
    supportsPrompt: true,
  },

  // Luma Photon models
  'photon-modify': {
    atlasName: 'luma/photon-modify',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image',
    category: 'image-editing',
    defaultGuidanceScale: 5.0,
    maxReferenceImages: 1,
    supportsPrompt: true,
  },
  'photon-flash-modify': {
    atlasName: 'luma/photon-flash-modify',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image',
    category: 'image-editing',
    defaultGuidanceScale: 5.0,
    maxReferenceImages: 1,
    supportsPrompt: true,
  },

  // AtlasCloud Image Editing models
  'ghibli': {
    atlasName: 'atlascloud/ghibli',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image',
    category: 'style-transfer',
    defaultGuidanceScale: 4.0,
    maxReferenceImages: 1,
    supportsPrompt: false, // Style transfer - Ghibli animation style
  },
  'instant-character': {
    atlasName: 'atlascloud/instant-character',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image',
    category: 'image-editing',
    defaultGuidanceScale: 5.0,
    maxReferenceImages: 1,
    supportsPrompt: true,
  },
  'hidream-e1-full': {
    atlasName: 'atlascloud/hidream-e1-full',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image',
    category: 'image-editing',
    defaultGuidanceScale: 5.0,
    maxReferenceImages: 1,
    supportsPrompt: true,
  },
  'step1x-edit': {
    atlasName: 'atlascloud/step1x-edit',
    minSize: '1024*1024',
    defaultSteps: 30,
    requiresImage: true,
    imageField: 'image',
    category: 'image-editing',
    defaultGuidanceScale: 4.0,
    maxReferenceImages: 1,
    supportsPrompt: true,
  },

  // Upscaling - no prompt support
  'recraft-crisp-upscale': {
    atlasName: 'recraft-ai/recraft-crisp-upscale', // Per API contract
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image',
    category: 'upscaling',
    defaultGuidanceScale: 3.5, // Upscaling doesn't need high guidance
    maxReferenceImages: 1,
    supportsPrompt: false, // Upscaling model - just enhances image quality
  },
  'recraft-creative-upscale': {
    atlasName: 'recraft-ai/recraft-creative-upscale',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image',
    category: 'upscaling',
    defaultGuidanceScale: 3.5,
    maxReferenceImages: 1,
    supportsPrompt: false, // Creative upscaling - enhances with AI interpretation
  },
  'real-esrgan': {
    atlasName: 'atlascloud/real-esrgan',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image',
    category: 'upscaling',
    defaultGuidanceScale: 3.5,
    maxReferenceImages: 1,
    supportsPrompt: false, // Real-ESRGAN super resolution - no prompt
  },

  // Utilities - no prompt support
  'image-zoom-out': {
    atlasName: 'atlascloud/image-zoom-out',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image',
    category: 'image-editing', // Utility but uses image-editing category
    defaultGuidanceScale: 4.0,
    maxReferenceImages: 1,
    supportsPrompt: false, // Outpainting/zoom-out - no prompt needed
  },
  'image-watermark-remover': {
    atlasName: 'atlascloud/image-watermark-remover',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image',
    category: 'image-editing', // Utility but uses image-editing category
    defaultGuidanceScale: 4.0,
    maxReferenceImages: 1,
    supportsPrompt: false, // Watermark removal - no prompt needed
  },

  // Style Transfer (image-effects namespace per API contract) - no prompt support
  'plastic-bubble-figure': {
    atlasName: 'image-effects/plastic-bubble-figure', // Per API contract
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image', // Singular per API contract
    category: 'style-transfer',
    defaultGuidanceScale: 4.0,
    maxReferenceImages: 1,
    supportsPrompt: false, // Style transfer - applies preset style
  },
  'my-world': {
    atlasName: 'image-effects/my-world', // Per API contract
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image', // Singular per API contract
    category: 'style-transfer',
    defaultGuidanceScale: 4.0,
    maxReferenceImages: 1,
    supportsPrompt: false, // Style transfer - applies preset style
  },
  'micro-landscape-mini-world': {
    atlasName: 'image-effects/micro-landscape-mini-world', // Per API contract
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image', // Singular per API contract
    category: 'style-transfer',
    defaultGuidanceScale: 4.0,
    maxReferenceImages: 1,
    supportsPrompt: false, // Style transfer - applies preset style
  },
  'glass-ball': {
    atlasName: 'image-effects/glass-ball',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image',
    category: 'style-transfer',
    defaultGuidanceScale: 4.0,
    maxReferenceImages: 1,
    supportsPrompt: false, // Style transfer - glass ball effect
  },
  'felt-keychain': {
    atlasName: 'image-effects/felt-keychain',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image',
    category: 'style-transfer',
    defaultGuidanceScale: 4.0,
    maxReferenceImages: 1,
    supportsPrompt: false, // Style transfer - felt keychain effect
  },
  'felt-3d-polaroid': {
    atlasName: 'image-effects/felt-3d-polaroid',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image',
    category: 'style-transfer',
    defaultGuidanceScale: 4.0,
    maxReferenceImages: 1,
    supportsPrompt: false, // Style transfer - felt 3D polaroid effect
  },
  'advanced-photography': {
    atlasName: 'image-effects/advanced-photography',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image',
    category: 'style-transfer',
    defaultGuidanceScale: 4.0,
    maxReferenceImages: 1,
    supportsPrompt: false, // Style transfer - photography enhancement
  },
  'american-comic-style': {
    atlasName: 'image-effects/american-comic-style',
    minSize: '1024*1024',
    defaultSteps: 28,
    requiresImage: true,
    imageField: 'image',
    category: 'style-transfer',
    defaultGuidanceScale: 4.0,
    maxReferenceImages: 1,
    supportsPrompt: false, // Style transfer - American comic style
  },
};

export type AtlasImageGenerateOptions = {
  prompt: string;
  model?: AtlasImageModel;
  seed?: number;
  size?: string; // e.g., "1024*1024"
  numImages?: number;
  guidanceScale?: number;
  numInferenceSteps?: number;
  enableSafetyChecker?: boolean;
  referenceImages?: string[]; // Array of URLs or base64 - for image-to-image generation
};

export type AtlasVideoGenerateOptions = {
  prompt: string;
  model?: AtlasVideoModel;
  referenceImage?: string; // URL or base64
  duration?: number; // seconds
  fps?: number;
  seed?: number;
};

type AtlasPredictionResponse = {
  code: number;
  msg: string;
  data: {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    outputs?: string[]; // Array of URLs
    error?: string;
  };
};

/**
 * Parse Atlas Cloud error messages into user-friendly text
 */
export function parseAtlasError(error: string): string {
  // Size requirement errors
  if (error.includes('image size must be at least')) {
    const match = error.match(/at least (\d+) pixels/);
    const pixels = match?.[1] ? Number.parseInt(match[1], 10) : 0;
    const side = Math.sqrt(pixels);
    return `This model requires a minimum image size of ${side}x${side} pixels. Please use a larger reference image or choose a different model.`;
  }

  // Missing image field
  if (error.includes('property "image" is missing') || error.includes('property "images" is missing')) {
    return 'This model requires a reference image. Please provide a patient reference image or portrait.';
  }

  // Invalid model
  if (error.includes('model not found') || error.includes('invalid model')) {
    return 'The selected AI model is not available. Please choose a different model.';
  }

  // Rate limiting
  if (error.includes('rate limit') || error.includes('too many requests')) {
    return 'Too many image generation requests. Please wait a moment and try again.';
  }

  // Content policy
  if (error.includes('content policy') || error.includes('safety')) {
    return 'The prompt was rejected due to content policy. Please modify your prompt and try again.';
  }

  // Timeout
  if (error.includes('timeout') || error.includes('timed out')) {
    return 'Image generation timed out. Please try again with a simpler prompt.';
  }

  // Generic error - return original message cleaned up
  return error.replace(/Request id: \S+/g, '').trim() || 'Image generation failed. Please try again.';
}

/**
 * Determine model family for parameter formatting
 */
type ModelFamily =
  | 'flux-kontext-max-pro' // Max/Pro: ONLY seed, image, prompt, guidance_scale, safety_tolerance
  | 'flux-kontext-dev' // Dev variants: Extended params (size, num_images, num_inference_steps, etc.)
  | 'flux-kontext-multi' // Multi variants: Uses images array
  | 'flux-1.1-pro' // Uses aspect_ratio, output_format
  | 'flux-1.1-pro-ultra' // Uses aspect_ratio, output_format + raw parameter
  | 'flux-standard' // Uses size, num_inference_steps, guidance_scale
  | 'flux-lora' // Uses size, loras array
  | 'imagen' // Uses aspect_ratio, negative_prompt, num_images
  | 'atlascloud-imagen' // Uses aspect_ratio, output_format (no negative_prompt, no num_images)
  | 'nano-banana' // Uses aspect_ratio, resolution, output_format
  | 'gemini-image' // Uses aspect_ratio, output_format
  | 'recraft' // Uses aspect_ratio, style
  | 'ideogram' // Uses aspect_ratio, style
  | 'photon' // Minimal params (just prompt)
  | 'seedream' // Uses size, enable_prompt_expansion
  | 'wan' // Uses size, negative_prompt
  | 'atlascloud' // Uses size, enable_safety_checker
  | 'z-image' // Uses size, loras
  | 'style-transfer'; // Uses image, minimal params

function getModelFamily(model: AtlasImageModel): ModelFamily {
  // Flux Kontext models - split by specific variant
  // Max/Pro use minimal params: seed, image, prompt, guidance_scale, safety_tolerance
  if (model === 'flux-kontext-max' || model === 'flux-kontext-pro') {
    return 'flux-kontext-max-pro';
  }
  // Multi variants use images array
  if (model.includes('-multi')) {
    return 'flux-kontext-multi';
  }
  // Dev variants use extended params
  if (model.startsWith('flux-kontext-dev') || model.startsWith('flux-kontext')) {
    return 'flux-kontext-dev';
  }

  // Flux 1.1 Pro models - ultra variant requires `raw` parameter
  if (model === 'flux-1.1-pro-ultra') return 'flux-1.1-pro-ultra';
  if (model === 'flux-1.1-pro') return 'flux-1.1-pro';

  // Flux LoRA models
  if (model.includes('-lora')) return 'flux-lora';

  // Standard Flux models
  if (model.startsWith('flux-') && !model.includes('kontext') && !model.includes('lora') && !model.includes('1.1-pro')) {
    return 'flux-standard';
  }

  // Google Imagen models (but not atlascloud-imagen4 which has different format)
  if (model.startsWith('imagen')) return 'imagen';

  // AtlasCloud Imagen4 has different params than Google Imagen
  if (model === 'atlascloud-imagen4') return 'atlascloud-imagen';

  // Google Nano Banana models
  if (model.includes('nano-banana')) return 'nano-banana';

  // Google Gemini Image models
  if (model.includes('gemini-2.5-flash-t2i')) return 'gemini-image';

  // Recraft models
  if (model.startsWith('recraft')) return 'recraft';

  // Ideogram models
  if (model.startsWith('ideogram')) return 'ideogram';

  // Luma Photon models
  if (model.startsWith('photon')) return 'photon';

  // ByteDance Seedream models
  if (model.startsWith('seedream') || model === 'seededit-v3' || model === 'portrait') return 'seedream';

  // Alibaba Wan models (but NOT qwen-t2i which uses atlascloud format)
  if (model.startsWith('wan-')) return 'wan';

  // Qwen image-edit models use wan format, but qwen-t2i uses atlascloud format
  if (model.startsWith('qwen-image-edit')) return 'wan';

  // Z-Image models
  if (model.startsWith('z-image')) return 'z-image';

  // Style transfer models
  if ([
    'plastic-bubble-figure', 'my-world', 'micro-landscape-mini-world', 'glass-ball',
    'felt-keychain', 'felt-3d-polaroid', 'advanced-photography', 'american-comic-style',
    'ghibli',
  ].includes(model)) {
    return 'style-transfer';
  }

  // AtlasCloud generic models (hidream, hunyuan, neta-lumina, etc.)
  return 'atlascloud';
}

/**
 * Build model-specific request body based on family
 * Each model family has different required/supported parameters per Atlas Cloud API documentation
 */
function buildModelRequestBody(
  model: AtlasImageModel,
  modelConfig: ModelConfig,
  options: AtlasImageGenerateOptions,
): Record<string, unknown> {
  const family = getModelFamily(model);
  const baseParams = {
    model: modelConfig.atlasName,
    prompt: options.prompt,
    enable_base64_output: false,
  };

  // Helper to add reference images
  const addReferenceImages = (body: Record<string, unknown>) => {
    if (options.referenceImages && options.referenceImages.length > 0 && modelConfig.imageField) {
      if (modelConfig.imageField === 'image') {
        body.image = options.referenceImages[0];
      } else if (modelConfig.imageField === 'images') {
        body.images = options.referenceImages;
      }
    }
    return body;
  };

  switch (family) {
    case 'flux-kontext-max-pro': {
      // Flux Kontext Max/Pro (image-to-image): ONLY basic params
      // Per IMAGE_TO_IMAGE.md - NO aspect_ratio, NO num_images
      const body: Record<string, unknown> = {
        model: modelConfig.atlasName,
        prompt: options.prompt,
        enable_base64_output: false,
        seed: options.seed ?? 1,
        guidance_scale: options.guidanceScale ?? modelConfig.defaultGuidanceScale,
        safety_tolerance: '2',
      };
      return addReferenceImages(body);
    }

    case 'flux-kontext-dev': {
      // Flux Kontext Dev variants: Extended params
      // Per IMAGE_TO_IMAGE.md - uses size, num_images, num_inference_steps, enable_safety_checker
      const body: Record<string, unknown> = {
        ...baseParams,
        seed: options.seed ?? -1,
        size: options.size || modelConfig.minSize,
        num_images: options.numImages || 1,
        guidance_scale: options.guidanceScale ?? modelConfig.defaultGuidanceScale,
        num_inference_steps: options.numInferenceSteps ?? modelConfig.defaultSteps,
        enable_safety_checker: options.enableSafetyChecker ?? true,
      };
      return addReferenceImages(body);
    }

    case 'flux-kontext-multi': {
      // Flux Kontext Multi variants: Uses images array
      // Per IMAGE_TO_IMAGE.md - uses images array instead of image
      const body: Record<string, unknown> = {
        ...baseParams,
        seed: options.seed ?? -1,
        size: options.size || modelConfig.minSize,
        num_images: options.numImages || 1,
        guidance_scale: options.guidanceScale ?? modelConfig.defaultGuidanceScale,
        num_inference_steps: options.numInferenceSteps ?? modelConfig.defaultSteps,
        enable_safety_checker: options.enableSafetyChecker ?? true,
      };
      // Multi models use images array
      if (options.referenceImages && options.referenceImages.length > 0) {
        body.images = options.referenceImages;
      }
      return body;
    }

    case 'flux-1.1-pro': {
      // Flux 1.1 Pro: aspect_ratio, output_format
      // NO: size, num_inference_steps, guidance_scale, enable_safety_checker
      return {
        ...baseParams,
        seed: options.seed ?? 1,
        aspect_ratio: '1:1',
        output_format: 'jpg',
      };
    }

    case 'flux-1.1-pro-ultra': {
      // Flux 1.1 Pro Ultra: same as 1.1 Pro + REQUIRED raw parameter
      // Per TEXT_TO_IMAGE.md lines 1469-1477
      return {
        ...baseParams,
        raw: false,
        seed: options.seed ?? 1,
        aspect_ratio: '1:1',
        output_format: 'jpg',
      };
    }

    case 'flux-standard': {
      // Standard Flux (dev, schnell, etc.): size, num_inference_steps, guidance_scale, enable_safety_checker
      const body: Record<string, unknown> = {
        ...baseParams,
        seed: options.seed ?? -1,
        size: options.size || modelConfig.minSize,
        num_images: options.numImages || 1,
        guidance_scale: options.guidanceScale ?? modelConfig.defaultGuidanceScale,
        num_inference_steps: options.numInferenceSteps ?? modelConfig.defaultSteps,
        enable_sync_mode: false,
        enable_safety_checker: options.enableSafetyChecker ?? true,
      };
      return addReferenceImages(body);
    }

    case 'flux-lora': {
      // Flux LoRA models: size, loras array, strength
      const body: Record<string, unknown> = {
        ...baseParams,
        seed: options.seed ?? -1,
        size: options.size || modelConfig.minSize,
        loras: [], // Would need to be passed in options if needed
        strength: 0.8,
        num_images: options.numImages || 1,
        guidance_scale: options.guidanceScale ?? modelConfig.defaultGuidanceScale,
        num_inference_steps: options.numInferenceSteps ?? modelConfig.defaultSteps,
        enable_safety_checker: options.enableSafetyChecker ?? true,
      };
      return addReferenceImages(body);
    }

    case 'imagen': {
      // Google Imagen: aspect_ratio, negative_prompt, num_images
      // NO: size, num_inference_steps, guidance_scale
      return {
        ...baseParams,
        seed: options.seed ?? 1,
        num_images: options.numImages || 1,
        aspect_ratio: '1:1',
        negative_prompt: '',
      };
    }

    case 'atlascloud-imagen': {
      // AtlasCloud Imagen4: aspect_ratio, output_format (NO negative_prompt, NO num_images)
      return {
        ...baseParams,
        seed: options.seed ?? 1,
        aspect_ratio: '1:1',
        output_format: 'png',
      };
    }

    case 'nano-banana': {
      // Nano Banana: aspect_ratio, resolution, output_format
      // NO: size, guidance_scale, num_inference_steps
      return {
        ...baseParams,
        aspect_ratio: '1:1',
        resolution: '1k',
        output_format: 'png',
        enable_sync_mode: false,
      };
    }

    case 'gemini-image': {
      // Gemini Image: aspect_ratio, output_format
      // NO: size, guidance_scale, num_inference_steps
      return {
        ...baseParams,
        aspect_ratio: '16:9',
        output_format: 'png',
        enable_sync_mode: false,
      };
    }

    case 'recraft': {
      // Recraft: aspect_ratio, style
      // NO: size, guidance_scale, num_inference_steps
      const body: Record<string, unknown> = {
        ...baseParams,
        aspect_ratio: '1:1',
        style: 'realistic_image',
      };
      return addReferenceImages(body);
    }

    case 'ideogram': {
      // Ideogram: aspect_ratio, style, optional image/mask_image
      // NO: size, guidance_scale, num_inference_steps
      const body: Record<string, unknown> = {
        ...baseParams,
        aspect_ratio: '1:1',
        style: 'Auto',
      };
      return addReferenceImages(body);
    }

    case 'photon': {
      // Luma Photon: minimal params (just prompt)
      // NO: size, guidance_scale, num_inference_steps, aspect_ratio
      return {
        ...baseParams,
      };
    }

    case 'seedream': {
      // ByteDance Seedream: size, enable_prompt_expansion
      // Per TEXT_TO_IMAGE.md lines 670-677
      const body: Record<string, unknown> = {
        ...baseParams,
        seed: options.seed ?? -1,
        size: options.size || modelConfig.minSize,
        enable_sync_mode: false,
        enable_prompt_expansion: true,
      };
      return addReferenceImages(body);
    }

    case 'wan': {
      // Alibaba Wan/Qwen: size, negative_prompt, enable_prompt_expansion
      // Per TEXT_TO_IMAGE.md lines 543-552
      const body: Record<string, unknown> = {
        ...baseParams,
        seed: options.seed ?? -1,
        size: options.size || modelConfig.minSize,
        negative_prompt: '',
        enable_prompt_expansion: false,
        enable_sync_mode: false,
        enable_base64_output: false,
      };
      return addReferenceImages(body);
    }

    case 'z-image': {
      // Z-Image: size, optional loras (for turbo-lora variant)
      const zImageBody: Record<string, unknown> = {
        ...baseParams,
        seed: options.seed ?? -1,
        size: options.size || modelConfig.minSize,
        enable_sync_mode: false,
      };
      // Add loras array for z-image-turbo-lora variant
      if (model === 'z-image-turbo-lora') {
        zImageBody.loras = [];
      }
      return zImageBody;
    }

    case 'style-transfer': {
      // Style transfer: just image input, minimal params (no prompt for most)
      const body: Record<string, unknown> = {
        model: modelConfig.atlasName,
        enable_base64_output: false,
      };
      // Add prompt only if model supports it
      if (modelConfig.supportsPrompt) {
        body.prompt = options.prompt;
      }
      return addReferenceImages(body);
    }

    case 'atlascloud':
    default: {
      // AtlasCloud generic (hidream, hunyuan, neta-lumina, etc.): size, enable_safety_checker
      const body: Record<string, unknown> = {
        ...baseParams,
        seed: options.seed ?? -1,
        size: options.size || modelConfig.minSize,
        output_format: 'jpeg',
        enable_sync_mode: false,
        enable_safety_checker: options.enableSafetyChecker ?? true,
      };
      return addReferenceImages(body);
    }
  }
}

/**
 * Generate image with Atlas Cloud
 */
export async function generateImageWithAtlas(
  options: AtlasImageGenerateOptions,
): Promise<{ imageUrl: string; model: string }> {
  const apiKey = process.env.ATLASCLOUD_API_KEY;

  if (!apiKey) {
    throw new Error('ATLASCLOUD_API_KEY is not configured');
  }

  const model = options.model || 'flux-schnell';
  const modelConfig = MODEL_CONFIGS[model];

  if (!modelConfig) {
    throw new Error(`Unknown model: ${model}. Please select a valid Atlas Cloud model.`);
  }

  // Validate: Image-editing models require reference images
  if (modelConfig.requiresImage && (!options.referenceImages || options.referenceImages.length === 0)) {
    throw new Error(`Model "${model}" requires a reference image. Please provide a patient reference image or portrait.`);
  }

  // Build request body based on model family (each family has different parameter requirements)
  const requestBody = buildModelRequestBody(model, modelConfig, options);

  // Step 1: Start image generation
  console.log('[AtlasCloud] Starting image generation with request:', {
    url: 'https://api.atlascloud.ai/api/v1/model/generateImage',
    model: modelConfig.atlasName,
    prompt: options.prompt.substring(0, 100) + (options.prompt.length > 100 ? '...' : ''),
    size: requestBody.size,
    numImages: requestBody.num_images,
    guidanceScale: requestBody.guidance_scale, // Added for debugging prompt following
    referenceImageCount: options.referenceImages?.length || 0,
    maxReferenceImages: modelConfig.maxReferenceImages,
    requestBody,
  });

  const generateResponse = await fetch(
    'https://api.atlascloud.ai/api/v1/model/generateImage',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    },
  );

  console.log('[AtlasCloud] Response status:', generateResponse.status, generateResponse.statusText);

  if (!generateResponse.ok) {
    const error = await generateResponse.json().catch(() => ({ msg: 'Unknown error' }));
    console.error('[AtlasCloud] Error response:', {
      status: generateResponse.status,
      statusText: generateResponse.statusText,
      error,
      headers: Object.fromEntries(generateResponse.headers.entries()),
    });
    throw new Error(`Atlas Cloud error: ${error.msg || generateResponse.statusText}`);
  }

  const generateResult: AtlasPredictionResponse = await generateResponse.json();

  console.log('[AtlasCloud] Generate result:', {
    code: generateResult.code,
    msg: generateResult.msg,
    predictionId: generateResult.data?.id,
    status: generateResult.data?.status,
  });

  if (generateResult.code !== 200) {
    console.error('[AtlasCloud] Non-200 code in response:', generateResult);
    throw new Error(`Atlas Cloud error: ${generateResult.msg}`);
  }

  const predictionId = generateResult.data.id;

  console.log('[AtlasCloud] Polling for result with prediction ID:', predictionId);

  // Step 2: Poll for result
  const imageUrl = await pollAtlasStatus(predictionId, apiKey, 'image');

  console.log('[AtlasCloud] Image generation successful:', imageUrl);

  return {
    imageUrl,
    model,
  };
}

/**
 * Video model family for parameter formatting
 * Different video models require different parameters per IMAGE_TO_VIDEO.md
 */
type VideoModelFamily =
  | 'seedance' // aspect_ratio, camera_fixed, generate_audio, resolution
  | 'kling-standard' // cfg_scale, negative_prompt, sound
  | 'kling-o1' // aspect_ratio, last_image
  | 'kling-multi' // images[], aspect_ratio
  | 'kling-effects' // effect_scene only
  | 'veo' // aspect_ratio, generate_audio, negative_prompt, resolution
  | 'veo-ref' // images[], generate_audio, negative_prompt, resolution
  | 'sora' // Basic: image, prompt, duration
  | 'sora-dev' // Basic + size
  | 'hailuo' // enable_prompt_expansion
  | 'luma' // size, duration (string)
  | 'vidu' // images[], movement_amplitude
  | 'wan-video' // enable_prompt_expansion, negative_prompt, resolution
  | 'video-effects' // image only
  | 'ltx' // generate_audio
  | 'generic'; // Basic params

function getVideoModelFamily(atlasModel: string): VideoModelFamily {
  // Seedance models
  if (atlasModel.includes('seedance')) return 'seedance';

  // Kling models - split by type
  if (atlasModel.includes('kling-effects')) return 'kling-effects';
  if (atlasModel.includes('kling') && atlasModel.includes('multi')) return 'kling-multi';
  if (atlasModel.includes('kling-video-o1')) return 'kling-o1';
  if (atlasModel.includes('kling')) return 'kling-standard';

  // Veo models
  if (atlasModel.includes('veo') && atlasModel.includes('reference')) return 'veo-ref';
  if (atlasModel.includes('veo')) return 'veo';

  // Sora models
  if (atlasModel.includes('sora') && atlasModel.includes('developer')) return 'sora-dev';
  if (atlasModel.includes('sora')) return 'sora';

  // Hailuo models
  if (atlasModel.includes('hailuo')) return 'hailuo';

  // Luma models
  if (atlasModel.includes('luma') || atlasModel.includes('ray-2')) return 'luma';

  // Vidu models
  if (atlasModel.includes('vidu')) return 'vidu';

  // WAN video models
  if (atlasModel.includes('wan') && atlasModel.includes('video')) return 'wan-video';

  // LTX models
  if (atlasModel.includes('ltx')) return 'ltx';

  // Video effects
  if (atlasModel.includes('video-effects')) return 'video-effects';

  return 'generic';
}

function buildVideoRequestBody(
  atlasModel: string,
  options: AtlasVideoGenerateOptions,
): Record<string, unknown> {
  const family = getVideoModelFamily(atlasModel);
  const baseParams = {
    model: atlasModel,
    prompt: options.prompt,
  };

  switch (family) {
    case 'seedance': {
      // Per IMAGE_TO_VIDEO.md: aspect_ratio, camera_fixed, duration, generate_audio, resolution, seed
      return {
        ...baseParams,
        image: options.referenceImage || '',
        aspect_ratio: '16:9',
        camera_fixed: false,
        duration: options.duration || 5,
        generate_audio: true,
        resolution: '720p',
        seed: options.seed ?? -1,
      };
    }

    case 'kling-standard': {
      // Per IMAGE_TO_VIDEO.md: cfg_scale, duration, negative_prompt, sound
      return {
        ...baseParams,
        image: options.referenceImage || '',
        cfg_scale: 0.5,
        duration: options.duration || 5,
        negative_prompt: '',
        sound: true,
      };
    }

    case 'kling-o1': {
      // Per IMAGE_TO_VIDEO.md: aspect_ratio, duration, last_image
      return {
        ...baseParams,
        image: options.referenceImage || '',
        aspect_ratio: '16:9',
        duration: options.duration || 5,
      };
    }

    case 'kling-multi': {
      // Per IMAGE_TO_VIDEO.md: images array, aspect_ratio, duration, negative_prompt
      return {
        ...baseParams,
        images: options.referenceImage ? [options.referenceImage] : [],
        aspect_ratio: '1:1',
        duration: options.duration || 5,
        negative_prompt: '',
      };
    }

    case 'kling-effects': {
      // Per IMAGE_TO_VIDEO.md: image, effect_scene only (no prompt needed)
      return {
        model: atlasModel,
        image: options.referenceImage || '',
        effect_scene: 'firework_2026',
      };
    }

    case 'veo': {
      // Per IMAGE_TO_VIDEO.md: aspect_ratio, duration, generate_audio, negative_prompt, resolution, seed
      return {
        ...baseParams,
        image: options.referenceImage || '',
        aspect_ratio: '16:9',
        duration: options.duration || 8,
        generate_audio: true,
        negative_prompt: '',
        resolution: '1080p',
        seed: options.seed ?? 1,
      };
    }

    case 'veo-ref': {
      // Per IMAGE_TO_VIDEO.md: images array, generate_audio, negative_prompt, resolution, seed
      return {
        ...baseParams,
        images: options.referenceImage ? [options.referenceImage] : [],
        generate_audio: true,
        negative_prompt: '',
        resolution: '1080p',
        seed: options.seed ?? 1,
      };
    }

    case 'sora': {
      // Per IMAGE_TO_VIDEO.md: Basic params only (no seed for Sora)
      return {
        ...baseParams,
        image: options.referenceImage || '',
        duration: options.duration || 8,
      };
    }

    case 'sora-dev': {
      // Per IMAGE_TO_VIDEO.md: Basic params + size
      return {
        ...baseParams,
        image: options.referenceImage || '',
        duration: options.duration || 10,
        size: '720*1280',
      };
    }

    case 'hailuo': {
      // Per IMAGE_TO_VIDEO.md: duration, enable_prompt_expansion
      return {
        ...baseParams,
        image: options.referenceImage || '',
        duration: options.duration || 6,
        enable_prompt_expansion: false,
      };
    }

    case 'luma': {
      // Per IMAGE_TO_VIDEO.md: size, duration (STRING not number!)
      return {
        ...baseParams,
        image: options.referenceImage || '',
        size: '1280*720',
        duration: String(options.duration || 5),
      };
    }

    case 'vidu': {
      // Per IMAGE_TO_VIDEO.md: images array, aspect_ratio, seed, movement_amplitude
      return {
        ...baseParams,
        images: options.referenceImage ? [options.referenceImage] : [],
        aspect_ratio: '16:9',
        seed: options.seed ?? 0,
        movement_amplitude: 'auto',
      };
    }

    case 'wan-video': {
      // Per IMAGE_TO_VIDEO.md: enable_prompt_expansion, negative_prompt, resolution, seed
      return {
        ...baseParams,
        image: options.referenceImage || '',
        duration: options.duration || 5,
        enable_prompt_expansion: false,
        negative_prompt: '',
        resolution: '720p',
        seed: options.seed ?? -1,
      };
    }

    case 'ltx': {
      // Per IMAGE_TO_VIDEO.md: duration, generate_audio
      return {
        ...baseParams,
        image: options.referenceImage || '',
        duration: options.duration || 8,
        generate_audio: true,
      };
    }

    case 'video-effects': {
      // Video effects only need image (no prompt, no duration)
      return {
        model: atlasModel,
        image: options.referenceImage || '',
      };
    }

    default: {
      // Generic fallback
      return {
        ...baseParams,
        image: options.referenceImage || '',
        duration: options.duration || 5,
        seed: options.seed ?? -1,
      };
    }
  }
}

/**
 * Generate video with Atlas Cloud
 */
export async function generateVideoWithAtlas(
  options: AtlasVideoGenerateOptions,
): Promise<{ videoUrl: string; model: string }> {
  const apiKey = process.env.ATLASCLOUD_API_KEY;

  if (!apiKey) {
    throw new Error('ATLASCLOUD_API_KEY is not configured');
  }

  const model = options.model || 'seedance-v1.5-pro-i2v';

  // Import the mapping function from ModelMetadata
  const { getAtlasCloudVideoModelId } = await import('../ModelMetadata');

  // Get the correct Atlas API model string
  const atlasModel = getAtlasCloudVideoModelId(model);

  // Build model-specific request body
  const requestBody = buildVideoRequestBody(atlasModel, options);

  // Comprehensive logging
  console.log('[AtlasCloud Video] === STARTING VIDEO GENERATION ===');
  console.log('[AtlasCloud Video] Input model from options:', options.model);
  console.log('[AtlasCloud Video] Resolved model (after default):', model);
  console.log('[AtlasCloud Video] Mapped Atlas API model:', atlasModel);
  console.log('[AtlasCloud Video] Model family:', getVideoModelFamily(atlasModel));
  console.log('[AtlasCloud Video] Prompt:', `${options.prompt?.substring(0, 100)}...`);
  console.log('[AtlasCloud Video] Image (reference):', options.referenceImage ? 'YES (provided)' : 'NO');
  console.log('[AtlasCloud Video] Duration:', options.duration || 5);
  console.log('[AtlasCloud Video] Full request body:', JSON.stringify(requestBody, null, 2));

  // Step 1: Start video generation
  const generateResponse = await fetch(
    'https://api.atlascloud.ai/api/v1/model/generateVideo',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    },
  );

  console.log('[AtlasCloud Video] Response status:', generateResponse.status, generateResponse.statusText);

  if (!generateResponse.ok) {
    const errorText = await generateResponse.text();
    console.log('[AtlasCloud Video] ERROR response body:', errorText);
    let error;
    try {
      error = JSON.parse(errorText);
    } catch {
      error = { msg: errorText || 'Unknown error' };
    }
    throw new Error(`Atlas Cloud error: ${error.msg || generateResponse.statusText}`);
  }

  const generateResult: AtlasPredictionResponse = await generateResponse.json();

  if (generateResult.code !== 200) {
    const errorMsg = generateResult.msg || generateResult.data?.error || 'Video generation failed';
    throw new Error(`Atlas Cloud error: ${errorMsg}`);
  }

  const predictionId = generateResult.data.id;

  // Step 2: Poll for result
  const videoUrl = await pollAtlasStatus(predictionId, apiKey, 'video');

  return {
    videoUrl,
    model,
  };
}

/**
 * Poll Atlas Cloud for prediction status
 */
async function pollAtlasStatus(
  predictionId: string,
  apiKey: string,
  type: 'image' | 'video',
): Promise<string> {
  // Images: 2 minutes (60 * 2s), Videos: 5 minutes (150 * 2s)
  const maxAttempts = type === 'video' ? 150 : 60;
  let attempts = 0;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    attempts++;

    const response = await fetch(
      `https://api.atlascloud.ai/api/v1/model/prediction/${predictionId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to check status: ${response.statusText}`);
    }

    const result: AtlasPredictionResponse = await response.json();

    if (result.code !== 200) {
      // Log full response for debugging
      console.error('[AtlasCloud] Polling error response:', result);
      const errorMsg = result.msg || result.data?.error || `Request failed with code ${result.code}`;
      throw new Error(`Atlas Cloud error: ${errorMsg}`);
    }

    if (result.data.status === 'completed') {
      if (!result.data.outputs || result.data.outputs.length === 0) {
        throw new Error(`No ${type} generated`);
      }
      const output = result.data.outputs[0];
      if (!output) {
        throw new Error(`Invalid ${type} output`);
      }
      return output;
    }

    if (result.data.status === 'failed') {
      throw new Error(result.data.error || `${type} generation failed`);
    }

    // Still processing, continue polling
  }

  throw new Error(`${type} generation timed out after ${maxAttempts * 2} seconds`);
}

/**
 * Get available Atlas Cloud image models
 * Complete list of all 52 models from API contract
 */
export function getAtlasImageModels(): Array<{
  id: AtlasImageModel;
  name: string;
  description: string;
  pricing: string;
  supportsImageToImage: boolean;
  category: 'text-to-image' | 'image-editing' | 'upscaling' | 'style-transfer';
}> {
  return [
    // ===== TEXT-TO-IMAGE (3 models) =====
    {
      id: 'flux-schnell',
      name: 'Flux Schnell',
      description: 'Fastest image generation (4 steps) - 12B parameter model',
      pricing: '$0.0024/image',
      supportsImageToImage: false,
      category: 'text-to-image',
    },
    {
      id: 'flux-dev',
      name: 'Flux Dev',
      description: 'High quality image generation (28 steps) - 12B parameter model',
      pricing: '$0.0096/image',
      supportsImageToImage: false,
      category: 'text-to-image',
    },
    {
      id: 'flux-2-flex-t2i',
      name: 'Flux 2 Flex (Text-to-Image)',
      description: 'Next-gen Flux model for text-to-image',
      pricing: '$0.01/image',
      supportsImageToImage: false,
      category: 'text-to-image',
    },

    // ===== FLUX REDUX (2 models) =====
    {
      id: 'flux-redux-dev',
      name: 'Flux Redux Dev',
      description: 'Image variation - creates variations of input image (no prompt)',
      pricing: '$0.0096/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'flux-redux-pro',
      name: 'Flux Redux Pro',
      description: 'Premium image variation with prompt support',
      pricing: '$0.04/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },

    // ===== FLUX 2 EDIT (3 models) =====
    {
      id: 'flux-2-dev-edit',
      name: 'Flux 2 Dev Edit',
      description: 'Next-gen image editing with multi-reference support',
      pricing: '$0.01/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'flux-2-pro-edit',
      name: 'Flux 2 Pro Edit',
      description: 'Premium next-gen editing with multi-reference',
      pricing: '$0.04/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'flux-2-flex-edit',
      name: 'Flux 2 Flex Edit',
      description: 'Flexible next-gen editing model',
      pricing: '$0.01/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },

    // ===== FLUX KONTEXT - SINGLE IMAGE (6 models) =====
    {
      id: 'flux-kontext-max',
      name: 'Flux Kontext Max',
      description: 'Maximum quality context-aware editing',
      pricing: '$0.08/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'flux-kontext-pro',
      name: 'Flux Kontext Pro',
      description: 'Professional context-aware editing',
      pricing: '$0.04/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'flux-kontext-dev',
      name: 'Flux Kontext Dev',
      description: 'Developer-tier context-aware editing',
      pricing: '$0.01/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'flux-kontext-dev-ultra-fast',
      name: 'Flux Kontext Dev Ultra Fast',
      description: 'Fastest Kontext model for rapid iteration',
      pricing: '$0.008/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'flux-kontext-dev-lora',
      name: 'Flux Kontext Dev LoRA',
      description: 'Kontext with LoRA fine-tuning support',
      pricing: '$0.012/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'flux-kontext-dev-lora-ultra-fast',
      name: 'Flux Kontext Dev LoRA Ultra Fast',
      description: 'Fast Kontext with LoRA support',
      pricing: '$0.01/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },

    // ===== FLUX KONTEXT - MULTI IMAGE (4 models) =====
    {
      id: 'flux-kontext-max-multi',
      name: 'Flux Kontext Max Multi',
      description: 'Maximum quality with multiple reference images',
      pricing: '$0.08/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'flux-kontext-pro-multi',
      name: 'Flux Kontext Pro Multi',
      description: 'Professional multi-reference editing',
      pricing: '$0.04/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'flux-kontext-dev-multi',
      name: 'Flux Kontext Dev Multi',
      description: 'Developer multi-reference editing',
      pricing: '$0.01/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'flux-kontext-dev-multi-ultra-fast',
      name: 'Flux Kontext Dev Multi Ultra Fast',
      description: 'Fastest multi-reference editing',
      pricing: '$0.008/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },

    // ===== FLUX SPECIAL (3 models) =====
    {
      id: 'flux-krea-dev-lora',
      name: 'Flux Krea Dev LoRA',
      description: 'Flux with Krea LoRA fine-tuning',
      pricing: '$0.012/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'flux-fill-dev',
      name: 'Flux Fill Dev (Inpainting)',
      description: 'Inpainting with mask support for targeted editing',
      pricing: '$0.01/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'flux-controlnet-pro',
      name: 'Flux ControlNet Pro',
      description: 'ControlNet conditioning for precise composition',
      pricing: '$0.04/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },

    // ===== SEEDREAM (4 models) =====
    {
      id: 'seedream-4.5-edit',
      name: 'Seedream v4.5 Edit',
      description: 'Preserves facial features, lighting, color tones (Best Quality)',
      pricing: '$0.04/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'seedream-4.5-edit-seq',
      name: 'Seedream v4.5 Sequential',
      description: 'Batch editing with feature preservation',
      pricing: '$0.04/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'seedream-4-edit',
      name: 'Seedream v4 Edit',
      description: 'Advanced image editing',
      pricing: '$0.027/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'seedream-4-edit-seq',
      name: 'Seedream v4 Sequential',
      description: 'Batch editing support',
      pricing: '$0.027/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },

    // ===== BYTEDANCE OTHER (2 models) =====
    {
      id: 'seededit-v3',
      name: 'SeedEdit v3',
      description: 'ByteDance image editing model',
      pricing: '$0.02/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'portrait',
      name: 'Portrait',
      description: 'ByteDance portrait enhancement',
      pricing: '$0.02/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },

    // ===== NANO BANANA (5 models) =====
    {
      id: 'nano-banana-pro-edit-ultra',
      name: 'Nano Banana Pro Ultra',
      description: 'Premium AI-powered adjustments',
      pricing: '$0.15/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'nano-banana-pro-edit',
      name: 'Nano Banana Pro Edit',
      description: 'Precise AI-powered visual adjustments',
      pricing: '$0.119/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'nano-banana-pro-edit-dev',
      name: 'Nano Banana Pro Dev',
      description: 'Developer version',
      pricing: '$0.07/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'nano-banana-edit',
      name: 'Nano Banana Edit',
      description: 'Google state-of-the-art editing',
      pricing: '$0.038/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'nano-banana-edit-dev',
      name: 'Nano Banana Edit Dev',
      description: 'Cheapest editing option',
      pricing: '$0.019/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },

    // ===== QWEN (2 models) =====
    {
      id: 'qwen-image-edit',
      name: 'Qwen Image Edit',
      description: '20B MMDiT model for image editing',
      pricing: '$0.02/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'qwen-image-edit-plus',
      name: 'Qwen Image Edit Plus',
      description: 'Enhanced 20B MMDiT model (1-3 images)',
      pricing: '$0.02/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },

    // ===== WAN / ALIBABA (3 models) =====
    {
      id: 'wan-2.6-i2i',
      name: 'Wan-2.6 Image Edit',
      description: 'Supports image editing and mixed text/image output',
      pricing: '$0.0225/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'wan-2.5-edit',
      name: 'Wan-2.5 Image Edit',
      description: 'Large-scale image generative',
      pricing: '$0.035/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'wan-2.1-t2i-lora',
      name: 'Wan-2.1 Text-to-Image LoRA',
      description: 'Wan model with LoRA fine-tuning support',
      pricing: '$0.02/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },

    // ===== LUMA PHOTON (2 models) =====
    {
      id: 'photon-modify',
      name: 'Luma Photon Modify',
      description: 'Luma AI image modification',
      pricing: '$0.03/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'photon-flash-modify',
      name: 'Luma Photon Flash Modify',
      description: 'Fast Luma AI modification',
      pricing: '$0.02/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },

    // ===== ATLASCLOUD IMAGE EDITING (4 models) =====
    {
      id: 'ghibli',
      name: 'Ghibli Style',
      description: 'Studio Ghibli animation style transfer (no prompt)',
      pricing: '$0.02/image',
      supportsImageToImage: true,
      category: 'style-transfer',
    },
    {
      id: 'instant-character',
      name: 'Instant Character',
      description: 'Character generation and modification',
      pricing: '$0.02/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'hidream-e1-full',
      name: 'HiDream E1 Full',
      description: 'AtlasCloud HiDream image editing',
      pricing: '$0.02/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'step1x-edit',
      name: 'Step1X Edit',
      description: 'AtlasCloud Step1X editing model',
      pricing: '$0.02/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },

    // ===== UPSCALING (3 models) =====
    {
      id: 'recraft-crisp-upscale',
      name: 'Recraft Crisp Upscale',
      description: 'Clean image upscaling (no prompt)',
      pricing: '$0.004/image',
      supportsImageToImage: true,
      category: 'upscaling',
    },
    {
      id: 'recraft-creative-upscale',
      name: 'Recraft Creative Upscale',
      description: 'AI-enhanced creative upscaling (no prompt)',
      pricing: '$0.008/image',
      supportsImageToImage: true,
      category: 'upscaling',
    },
    {
      id: 'real-esrgan',
      name: 'Real-ESRGAN',
      description: 'Super resolution upscaling (no prompt)',
      pricing: '$0.004/image',
      supportsImageToImage: true,
      category: 'upscaling',
    },

    // ===== UTILITIES (2 models) =====
    {
      id: 'image-zoom-out',
      name: 'Image Zoom Out',
      description: 'Outpainting - extends image beyond borders (no prompt)',
      pricing: '$0.02/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },
    {
      id: 'image-watermark-remover',
      name: 'Watermark Remover',
      description: 'Removes watermarks from images (no prompt)',
      pricing: '$0.01/image',
      supportsImageToImage: true,
      category: 'image-editing',
    },

    // ===== STYLE TRANSFER (8 models) =====
    {
      id: 'plastic-bubble-figure',
      name: 'Plastic Bubble Figure',
      description: 'Plastic figure style transfer (no prompt)',
      pricing: '$0.02/image',
      supportsImageToImage: true,
      category: 'style-transfer',
    },
    {
      id: 'my-world',
      name: 'My World',
      description: 'Fantasy world style transfer (no prompt)',
      pricing: '$0.02/image',
      supportsImageToImage: true,
      category: 'style-transfer',
    },
    {
      id: 'micro-landscape-mini-world',
      name: 'Micro Landscape Mini World',
      description: 'Miniature world style transfer (no prompt)',
      pricing: '$0.02/image',
      supportsImageToImage: true,
      category: 'style-transfer',
    },
    {
      id: 'glass-ball',
      name: 'Glass Ball',
      description: 'Glass ball/snow globe effect (no prompt)',
      pricing: '$0.02/image',
      supportsImageToImage: true,
      category: 'style-transfer',
    },
    {
      id: 'felt-keychain',
      name: 'Felt Keychain',
      description: 'Felt/plush keychain style (no prompt)',
      pricing: '$0.02/image',
      supportsImageToImage: true,
      category: 'style-transfer',
    },
    {
      id: 'felt-3d-polaroid',
      name: 'Felt 3D Polaroid',
      description: '3D felt polaroid style (no prompt)',
      pricing: '$0.02/image',
      supportsImageToImage: true,
      category: 'style-transfer',
    },
    {
      id: 'advanced-photography',
      name: 'Advanced Photography',
      description: 'Professional photography enhancement (no prompt)',
      pricing: '$0.02/image',
      supportsImageToImage: true,
      category: 'style-transfer',
    },
    {
      id: 'american-comic-style',
      name: 'American Comic Style',
      description: 'American comic book style transfer (no prompt)',
      pricing: '$0.02/image',
      supportsImageToImage: true,
      category: 'style-transfer',
    },
  ];
}

/**
 * Get available Atlas Cloud video models
 */
export function getAtlasVideoModels(): Array<{
  id: AtlasVideoModel;
  name: string;
  description: string;
}> {
  return [
    {
      id: 'seedance-v1.5-pro-i2v',
      name: 'SeeDance v1.5 Pro',
      description: 'High-quality video generation from images',
    },
    {
      id: 'seedance-v1-pro-fast-i2v',
      name: 'SeeDance v1 Pro Fast',
      description: 'Fast video generation from images',
    },
    {
      id: 'sora-2-i2v-pro',
      name: 'Sora 2 Pro',
      description: 'OpenAI Sora 2 image-to-video (Pro)',
    },
    {
      id: 'sora-2-i2v',
      name: 'Sora 2',
      description: 'OpenAI Sora 2 image-to-video',
    },
    {
      id: 'veo3.1-i2v',
      name: 'Veo 3.1',
      description: 'Google Veo 3.1 image-to-video',
    },
    {
      id: 'veo3-i2v',
      name: 'Veo 3',
      description: 'Google Veo 3 image-to-video',
    },
    {
      id: 'kling-2.6-pro-i2v',
      name: 'Kling 2.6 Pro',
      description: 'Kuaishou Kling 2.6 Pro image-to-video',
    },
    {
      id: 'wan-2.6-i2v',
      name: 'Wan 2.6',
      description: 'Alibaba Wan 2.6 image-to-video',
    },
    {
      id: 'hailuo-2.3-pro-i2v',
      name: 'Hailuo 2.3 Pro',
      description: 'MiniMax Hailuo 2.3 Pro image-to-video',
    },
    {
      id: 'luma-ray-2-i2v',
      name: 'Luma Ray 2',
      description: 'Luma Ray 2 image-to-video',
    },
  ];
}
