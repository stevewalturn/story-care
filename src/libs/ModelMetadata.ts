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
// maxReferenceImages: 0 = no reference, 1 = single image only, 4+ = multiple images
// supportsPrompt: false for upscaling, style transfer, and image variation models
export const IMAGE_GENERATION_MODELS = {
  // ===== TEXT-TO-IMAGE - FLUX (12 models) =====
  'Text-to-Image (Flux)': [
    { value: 'flux-1.1-pro-ultra', label: 'Flux 1.1 Pro Ultra (Best)', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'flux-1.1-pro', label: 'Flux 1.1 Pro', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'flux-dev', label: 'Flux Dev', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'flux-dev-ultra-fast', label: 'Flux Dev Ultra Fast', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'flux-dev-lora', label: 'Flux Dev LoRA', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'flux-dev-lora-ultra-fast', label: 'Flux Dev LoRA Ultra Fast', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'flux-schnell', label: 'Flux Schnell (Fastest)', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'flux-schnell-lora', label: 'Flux Schnell LoRA', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'flux-krea-dev-lora-t2i', label: 'Flux Krea Dev LoRA', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'flux-2-flex-t2i', label: 'Flux 2 Flex', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
  ],

  // ===== TEXT-TO-IMAGE - SEEDREAM/BYTEDANCE (6 models) =====
  'Text-to-Image (Seedream)': [
    { value: 'seedream-4.5-t2i', label: 'Seedream v4.5 (Best)', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'seedream-4.5-seq-t2i', label: 'Seedream v4.5 Sequential', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'seedream-4-t2i', label: 'Seedream v4', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'seedream-4-seq-t2i', label: 'Seedream v4 Sequential', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'seedream-3.1-t2i', label: 'Seedream v3.1', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'seedream-3-t2i', label: 'Seedream v3', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
  ],

  // ===== TEXT-TO-IMAGE - IMAGEN/GOOGLE (6 models) =====
  'Text-to-Image (Imagen)': [
    { value: 'imagen4-ultra', label: 'Imagen 4 Ultra (Best)', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'imagen4', label: 'Imagen 4', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'imagen4-fast', label: 'Imagen 4 Fast', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'atlascloud-imagen4', label: 'AtlasCloud Imagen 4', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'imagen3', label: 'Imagen 3', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'imagen3-fast', label: 'Imagen 3 Fast', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
  ],

  // ===== TEXT-TO-IMAGE - NANO BANANA/GOOGLE (7 models) =====
  'Text-to-Image (Nano Banana)': [
    { value: 'nano-banana-pro-t2i-ultra', label: 'Nano Banana Pro Ultra (Best)', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'nano-banana-pro-t2i', label: 'Nano Banana Pro', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'nano-banana-pro-t2i-dev', label: 'Nano Banana Pro Dev', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'nano-banana-t2i', label: 'Nano Banana', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'nano-banana-t2i-dev', label: 'Nano Banana Dev', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'gemini-2.5-flash-t2i', label: 'Gemini 2.5 Flash Image', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'gemini-2.5-flash-t2i-dev', label: 'Gemini 2.5 Flash Image Dev', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
  ],

  // ===== TEXT-TO-IMAGE - IDEOGRAM (6 models) =====
  'Text-to-Image (Ideogram)': [
    { value: 'ideogram-v3-quality', label: 'Ideogram v3 Quality (Best)', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'ideogram-v3-balanced', label: 'Ideogram v3 Balanced', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'ideogram-v3-turbo', label: 'Ideogram v3 Turbo', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'ideogram-v2', label: 'Ideogram v2', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'ideogram-v2-turbo', label: 'Ideogram v2 Turbo', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'ideogram-v2a-turbo', label: 'Ideogram v2a Turbo', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
  ],

  // ===== TEXT-TO-IMAGE - RECRAFT (4 models) =====
  'Text-to-Image (Recraft)': [
    { value: 'recraft-v3', label: 'Recraft v3 (Best)', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'recraft-v3-svg', label: 'Recraft v3 SVG', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'recraft-20b', label: 'Recraft 20B', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'recraft-20b-svg', label: 'Recraft 20B SVG', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
  ],

  // ===== TEXT-TO-IMAGE - ALIBABA/WAN (4 models) =====
  'Text-to-Image (Wan)': [
    { value: 'wan-2.6-t2i', label: 'Wan 2.6', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'wan-2.5-t2i', label: 'Wan 2.5', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'wan-2.1-t2i', label: 'Wan 2.1', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'wan-2.1-t2i-lora', label: 'Wan 2.1 LoRA', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
  ],

  // ===== TEXT-TO-IMAGE - LUMA (2 models) =====
  'Text-to-Image (Luma)': [
    { value: 'photon-t2i', label: 'Photon', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'photon-flash-t2i', label: 'Photon Flash (Fast)', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
  ],

  // ===== TEXT-TO-IMAGE - ATLASCLOUD (5 models) =====
  'Text-to-Image (AtlasCloud)': [
    { value: 'hunyuan-image-3', label: 'Hunyuan Image 3', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'neta-lumina', label: 'Neta Lumina', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'qwen-t2i', label: 'Qwen Image', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'hidream-i1-full', label: 'HiDream I1 Full', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'hidream-i1-dev', label: 'HiDream I1 Dev', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
  ],

  // ===== TEXT-TO-IMAGE - Z-IMAGE (2 models) =====
  'Text-to-Image (Z-Image)': [
    { value: 'z-image-turbo', label: 'Z-Image Turbo', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
    { value: 'z-image-turbo-lora', label: 'Z-Image Turbo LoRA', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
  ],

  // ===== IMAGE EDITING - FLUX KONTEXT (2 models) =====
  'Flux Kontext': [
    { value: 'flux-kontext-dev', label: 'Flux Kontext Dev', supportsReference: true, maxReferenceImages: 1, supportsPrompt: true },
    { value: 'flux-kontext-dev-lora', label: 'Flux Kontext Dev LoRA', supportsReference: true, maxReferenceImages: 1, supportsPrompt: true },
  ],

  // ===== IMAGE EDITING - FLUX 2 EDIT (3 models) =====
  'Flux 2 Edit': [
    { value: 'flux-2-pro-edit', label: 'Flux 2 Pro Edit (Best)', supportsReference: true, maxReferenceImages: 4, supportsPrompt: true },
    { value: 'flux-2-dev-edit', label: 'Flux 2 Dev Edit', supportsReference: true, maxReferenceImages: 4, supportsPrompt: true },
    { value: 'flux-2-flex-edit', label: 'Flux 2 Flex Edit', supportsReference: true, maxReferenceImages: 4, supportsPrompt: true },
  ],

  // ===== IMAGE EDITING - FLUX SPECIAL (5 models) =====
  'Flux Special': [
    { value: 'flux-redux-pro', label: 'Flux Redux Pro (Variation with Prompt)', supportsReference: true, maxReferenceImages: 1, supportsPrompt: true },
    { value: 'flux-redux-dev', label: 'Flux Redux Dev (Variation)', supportsReference: true, maxReferenceImages: 1, supportsPrompt: false },
    { value: 'flux-krea-dev-lora', label: 'Flux Krea Dev LoRA', supportsReference: true, maxReferenceImages: 1, supportsPrompt: true },
    { value: 'flux-fill-dev', label: 'Flux Fill Dev (Inpainting)', supportsReference: true, maxReferenceImages: 1, supportsPrompt: true },
    { value: 'flux-controlnet-pro', label: 'Flux ControlNet Pro', supportsReference: true, maxReferenceImages: 1, supportsPrompt: true },
  ],

  // ===== IMAGE EDITING - SEEDREAM/BYTEDANCE (6 models) =====
  'Seedream (ByteDance)': [
    { value: 'seedream-4.5-edit', label: 'Seedream v4.5 Edit (Best)', supportsReference: true, maxReferenceImages: 4, supportsPrompt: true },
    { value: 'seedream-4.5-edit-seq', label: 'Seedream v4.5 Sequential', supportsReference: true, maxReferenceImages: 4, supportsPrompt: true },
    { value: 'seedream-4-edit', label: 'Seedream v4 Edit', supportsReference: true, maxReferenceImages: 4, supportsPrompt: true },
    { value: 'seedream-4-edit-seq', label: 'Seedream v4 Sequential', supportsReference: true, maxReferenceImages: 4, supportsPrompt: true },
    { value: 'seededit-v3', label: 'SeedEdit v3', supportsReference: true, maxReferenceImages: 1, supportsPrompt: true },
    { value: 'portrait', label: 'Portrait (Face Edit)', supportsReference: true, maxReferenceImages: 1, supportsPrompt: true },
  ],

  // ===== IMAGE EDITING - NANO BANANA/GOOGLE (5 models) =====
  'Nano Banana (Google)': [
    { value: 'nano-banana-pro-edit-ultra', label: 'Nano Banana Pro Ultra (Best)', supportsReference: true, maxReferenceImages: 4, supportsPrompt: true },
    { value: 'nano-banana-pro-edit', label: 'Nano Banana Pro Edit', supportsReference: true, maxReferenceImages: 4, supportsPrompt: true },
    { value: 'nano-banana-pro-edit-dev', label: 'Nano Banana Pro Dev', supportsReference: true, maxReferenceImages: 4, supportsPrompt: true },
    { value: 'nano-banana-edit', label: 'Nano Banana Edit', supportsReference: true, maxReferenceImages: 4, supportsPrompt: true },
    { value: 'nano-banana-edit-dev', label: 'Nano Banana Edit Dev', supportsReference: true, maxReferenceImages: 4, supportsPrompt: true },
  ],

  // ===== IMAGE EDITING - ALIBABA/QWEN (4 models) =====
  'Alibaba/Qwen': [
    { value: 'qwen-image-edit-plus', label: 'Qwen Image Edit Plus', supportsReference: true, maxReferenceImages: 3, supportsPrompt: true },
    { value: 'qwen-image-edit', label: 'Qwen Image Edit', supportsReference: true, maxReferenceImages: 1, supportsPrompt: true },
    { value: 'wan-2.6-i2i', label: 'Wan 2.6 Image Edit', supportsReference: true, maxReferenceImages: 1, supportsPrompt: true },
    { value: 'wan-2.5-edit', label: 'Wan 2.5 Edit', supportsReference: true, maxReferenceImages: 1, supportsPrompt: true },
  ],

  // ===== IMAGE EDITING - LUMA (2 models) =====
  'Luma Photon': [
    { value: 'photon-modify', label: 'Photon Modify', supportsReference: true, maxReferenceImages: 1, supportsPrompt: true },
    { value: 'photon-flash-modify', label: 'Photon Flash Modify (Fast)', supportsReference: true, maxReferenceImages: 1, supportsPrompt: true },
  ],

  // ===== IMAGE EDITING - ATLASCLOUD SPECIAL (4 models) =====
  'AtlasCloud Special': [
    { value: 'hidream-e1-full', label: 'HiDream E1 Full', supportsReference: true, maxReferenceImages: 1, supportsPrompt: true },
    { value: 'step1x-edit', label: 'Step1X Edit', supportsReference: true, maxReferenceImages: 1, supportsPrompt: true },
    { value: 'instant-character', label: 'Instant Character', supportsReference: true, maxReferenceImages: 1, supportsPrompt: true },
    { value: 'ghibli', label: 'Ghibli Style', supportsReference: true, maxReferenceImages: 1, supportsPrompt: false },
  ],

  // ===== TEXT-TO-IMAGE LoRA (1 model) =====
  'Text-to-Image LoRA': [
    { value: 'wan-2.1-t2i-lora', label: 'Wan 2.1 Text-to-Image LoRA', supportsReference: false, maxReferenceImages: 0, supportsPrompt: true },
  ],

  // ===== UPSCALING (3 models) =====
  'Upscaling': [
    { value: 'recraft-creative-upscale', label: 'Recraft Creative Upscale (Enhances)', supportsReference: true, maxReferenceImages: 1, supportsPrompt: false },
    { value: 'recraft-crisp-upscale', label: 'Recraft Crisp Upscale (Sharp)', supportsReference: true, maxReferenceImages: 1, supportsPrompt: false },
    { value: 'real-esrgan', label: 'Real-ESRGAN (Fast)', supportsReference: true, maxReferenceImages: 1, supportsPrompt: false },
  ],

  // ===== UTILITIES (2 models) =====
  'Utilities': [
    { value: 'image-zoom-out', label: 'Image Zoom Out (Outpainting)', supportsReference: true, maxReferenceImages: 1, supportsPrompt: false },
    { value: 'image-watermark-remover', label: 'Watermark Remover', supportsReference: true, maxReferenceImages: 1, supportsPrompt: false },
  ],

  // ===== STYLE TRANSFER (8 models) =====
  'Style Transfer': [
    { value: 'plastic-bubble-figure', label: 'Plastic Bubble Figure', supportsReference: true, maxReferenceImages: 1, supportsPrompt: false },
    { value: 'my-world', label: 'My World (Fantasy)', supportsReference: true, maxReferenceImages: 1, supportsPrompt: false },
    { value: 'micro-landscape-mini-world', label: 'Micro Landscape Mini World', supportsReference: true, maxReferenceImages: 1, supportsPrompt: false },
    { value: 'glass-ball', label: 'Glass Ball/Snow Globe', supportsReference: true, maxReferenceImages: 1, supportsPrompt: false },
    { value: 'felt-keychain', label: 'Felt Keychain', supportsReference: true, maxReferenceImages: 1, supportsPrompt: false },
    { value: 'felt-3d-polaroid', label: 'Felt 3D Polaroid', supportsReference: true, maxReferenceImages: 1, supportsPrompt: false },
    { value: 'advanced-photography', label: 'Advanced Photography', supportsReference: true, maxReferenceImages: 1, supportsPrompt: false },
    { value: 'american-comic-style', label: 'American Comic Style', supportsReference: true, maxReferenceImages: 1, supportsPrompt: false },
  ],

  // ===== GOOGLE GEMINI (1 model) =====
  'Google Gemini': [
    { value: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image', supportsReference: true, maxReferenceImages: 1, supportsPrompt: true },
  ],
} as const;

// Video Generation Models - AtlasCloud Image-to-Video & Text-to-Video
export const VIDEO_GENERATION_MODELS = {
  // ===== TEXT-TO-VIDEO (Featured) =====
  'Text-to-Video (Featured)': [
    { value: 'veo3.1-t2v', label: 'Veo 3.1 T2V', description: 'Google flagship, no image needed' },
    { value: 'veo3.1-fast-t2v', label: 'Veo 3.1 Fast T2V', description: 'Google fast, no image needed' },
    { value: 'seedance-v1.5-pro-t2v', label: 'Seedance v1.5 Pro T2V', description: 'Cinematic, no image needed' },
    { value: 'seedance-v1.5-pro-fast-t2v', label: 'Seedance v1.5 Pro Fast T2V', description: 'Fast cinematic, no image needed' },
    { value: 'sora-2-t2v-pro', label: 'Sora 2 Pro T2V', description: 'OpenAI flagship, no image needed' },
    { value: 'kling-2.6-pro-t2v', label: 'Kling 2.6 Pro T2V', description: 'Dynamics, no image needed' },
    { value: 'kling-2.5-turbo-pro-t2v', label: 'Kling 2.5 Turbo Pro T2V', description: 'Fast turbo, no image needed' },
    { value: 'kling-video-o1-t2v', label: 'Kling Video O1 T2V', description: 'Physics simulation, no image needed' },
  ],

  // ===== TEXT-TO-VIDEO (Standard) =====
  'Text-to-Video (Standard)': [
    { value: 'hailuo-2.3-t2v-pro', label: 'Hailuo 2.3 T2V Pro', description: 'Character continuity, no image needed' },
    { value: 'hailuo-2.3-t2v-standard', label: 'Hailuo 2.3 T2V Standard', description: 'Smooth motion, no image needed' },
    { value: 'pixverse-4.5-t2v', label: 'PixVerse 4.5 T2V', description: 'Fast generation, no image needed' },
    { value: 'pika-2.2-t2v', label: 'Pika 2.2 T2V', description: 'Creative video, no image needed' },
    { value: 'pika-2.0-turbo-t2v', label: 'Pika 2.0 Turbo T2V', description: 'Fast turbo, no image needed' },
    { value: 'ray-2-t2v', label: 'Ray 2 T2V', description: 'Ray-traced quality, no image needed' },
    { value: 'ray-2-flash-t2v', label: 'Ray 2 Flash T2V', description: 'Fast ray-traced, no image needed' },
    { value: 'hunyuan-video-t2v', label: 'Hunyuan Video T2V', description: 'Hunyuan quality, no image needed' },
    { value: 'ltx-2-pro-t2v', label: 'LTX-2 Pro T2V', description: 'Longer, higher-res, no image needed' },
    { value: 'ltx-2-fast-t2v', label: 'LTX-2 Fast T2V', description: 'Fast coherent motion, no image needed' },
    { value: 'seedance-v1-pro-t2v-1080p', label: 'Seedance v1 Pro T2V 1080p', description: 'Pro quality 1080p, no image needed' },
    { value: 'seedance-v1-pro-t2v-720p', label: 'Seedance v1 Pro T2V 720p', description: 'Pro quality 720p, no image needed' },
    { value: 'seedance-v1-pro-t2v-480p', label: 'Seedance v1 Pro T2V 480p', description: 'Pro quality 480p, no image needed' },
  ],

  // ===== TEXT-TO-VIDEO (Budget) =====
  'Text-to-Video (Budget)': [
    { value: 'wan-2.6-t2v', label: 'Wan 2.6 T2V', description: 'Good fidelity, no image needed' },
    { value: 'wan-2.5-t2v', label: 'Wan 2.5 T2V', description: 'Good balance, no image needed' },
    { value: 'wan-2.5-fast-t2v', label: 'Wan 2.5 Fast T2V', description: 'Fast mode, no image needed' },
    { value: 'seedance-v1-pro-fast-t2v', label: 'Seedance v1 Pro Fast T2V', description: 'Cinematic low cost, no image needed' },
    { value: 'seedance-v1-lite-t2v-1080p', label: 'Seedance v1 Lite T2V 1080p', description: 'Lite 1080p, no image needed' },
    { value: 'seedance-v1-lite-t2v-720p', label: 'Seedance v1 Lite T2V 720p', description: 'Lite 720p, no image needed' },
    { value: 'seedance-v1-lite-t2v-480p', label: 'Seedance v1 Lite T2V 480p', description: 'Lite lowest cost, no image needed' },
  ],

  // ===== FEATURED (Best Quality) =====
  'Featured': [
    { value: 'sora-2-i2v-pro', label: 'Sora 2 Pro', description: 'OpenAI flagship, best quality' },
    { value: 'sora-2-i2v', label: 'Sora 2', description: 'OpenAI high quality' },
    { value: 'veo3.1-i2v', label: 'Veo 3.1', description: 'Google flagship, motion-rich' },
    { value: 'veo3-i2v', label: 'Veo 3', description: 'Google premium quality' },
    { value: 'seedance-v1.5-pro-i2v', label: 'Seedance v1.5 Pro', description: 'Audio-visual sync, cinematic' },
    { value: 'seedance-v1.5-pro-fast-i2v', label: 'Seedance v1.5 Pro Fast', description: 'Fast cinematic generation' },
    { value: 'kling-2.6-pro-i2v', label: 'Kling 2.6 Pro', description: 'Sound generation, dynamics' },
  ],

  // ===== PREMIUM (High Quality) =====
  'Premium': [
    { value: 'kling-video-o1-i2v', label: 'Kling Video O1', description: 'MVL tech, physics simulation' },
    { value: 'veo3.1-ref-i2v', label: 'Veo 3.1 Reference', description: 'Subject consistency' },
    { value: 'veo2-i2v', label: 'Veo 2', description: 'Google legacy premium' },
    { value: 'kling-2.5-turbo-pro-i2v', label: 'Kling 2.5 Turbo Pro', description: 'Fast turbo mode' },
    { value: 'kling-2.1-start-end-i2v', label: 'Kling 2.1 Start-End', description: 'Frame interpolation' },
    { value: 'kling-2.0-master-i2v', label: 'Kling 2.0 Master', description: 'Master quality mode' },
    { value: 'hailuo-2.3-pro-i2v', label: 'Hailuo 2.3 Pro', description: 'Character continuity' },
    { value: 'luma-ray-2-i2v', label: 'Luma Ray 2', description: 'Ray-traced quality' },
    { value: 'vidu-ref-2.0-i2v', label: 'Vidu Reference 2.0', description: 'Reference-based' },
    { value: 'vidu-ref-q1-i2v', label: 'Vidu Reference Q1', description: 'Quality mode' },
  ],

  // ===== STANDARD (Good Balance) =====
  'Standard': [
    { value: 'sora-2-i2v-pro-dev', label: 'Sora 2 Pro Dev', description: 'OpenAI developer mode' },
    { value: 'sora-2-i2v-dev', label: 'Sora 2 Dev', description: 'OpenAI dev mode' },
    { value: 'veo3.1-fast-i2v', label: 'Veo 3.1 Fast', description: 'Fast previews' },
    { value: 'veo3-fast-i2v', label: 'Veo 3 Fast', description: 'Fast mode' },
    { value: 'hailuo-2.3-standard-i2v', label: 'Hailuo 2.3 Standard', description: 'Smooth motion' },
    { value: 'hailuo-02-t2v-pro', label: 'Hailuo 0.2 T2V Pro', description: 'Text-to-video pro' },
    { value: 'kling-1.6-multi-pro-i2v', label: 'Kling 1.6 Multi Pro', description: 'Multi-frame pro' },
    { value: 'kling-1.6-multi-std-i2v', label: 'Kling 1.6 Multi Std', description: 'Multi-frame standard' },
    { value: 'ltx-2-pro-i2v', label: 'LTX-2 Pro', description: 'Longer, higher-res' },
    { value: 'vidu-start-end-2.0', label: 'Vidu Start-End 2.0', description: 'Frame interpolation' },
    { value: 'pika-2.0-turbo-i2v', label: 'Pika 2.0 Turbo', description: 'Fast turbo mode' },
    { value: 'pixverse-4.5-fast-i2v', label: 'PixVerse 4.5 Fast', description: 'Fast generation' },
    { value: 'seedance-v1-pro-i2v-1080p', label: 'Seedance v1 Pro 1080p', description: 'Pro quality, 1080p output' },
    { value: 'seedance-v1-pro-i2v-720p', label: 'Seedance v1 Pro 720p', description: 'Pro quality, 720p output' },
    { value: 'seedance-v1-pro-i2v-480p', label: 'Seedance v1 Pro 480p', description: 'Pro quality, 480p output' },
    { value: 'magi-1-24b', label: 'Magi 1 24B', description: 'Large model' },
  ],

  // ===== BUDGET (Fast & Affordable) =====
  'Budget Friendly': [
    { value: 'wan-2.6-i2v', label: 'Wan 2.6', description: 'Speed-optimized, good fidelity' },
    { value: 'wan-2.5-i2v', label: 'Wan 2.5', description: 'Good balance' },
    { value: 'wan-2.5-fast-i2v', label: 'Wan 2.5 Fast', description: 'Fast mode' },
    { value: 'wan-2.2-lora-i2v', label: 'Wan 2.2 LoRA', description: 'LoRA support' },
    { value: 'ltx-2-fast-i2v', label: 'LTX-2 Fast', description: 'Smooth, coherent motion' },
    { value: 'ltx-video-097-i2v', label: 'LTX Video 0.97', description: '720p output' },
    { value: 'seedance-v1-pro-fast-i2v', label: 'Seedance v1 Pro Fast', description: 'Cinematic motion, low cost' },
    { value: 'seedance-v1-lite-i2v-1080p', label: 'Seedance v1 Lite 1080p', description: 'Lite model, 1080p output' },
    { value: 'seedance-v1-lite-i2v-720p', label: 'Seedance v1 Lite 720p', description: 'Lite model, low latency, 720p' },
    { value: 'seedance-v1-lite-i2v-480p', label: 'Seedance v1 Lite 480p', description: 'Lite model, lowest cost, 480p' },
    { value: 'hailuo-2.3-fast-i2v', label: 'Hailuo 2.3 Fast', description: 'Rapid generation' },
    { value: 'kling-effects', label: 'Kling Effects', description: 'Special effects' },
  ],

  // ===== VIDEO EFFECTS (8 models) =====
  'Video Effects': [
    { value: 'video-zoom-out', label: 'Zoom Out', description: 'Camera zoom out effect' },
    { value: 'video-shake-dance', label: 'Shake Dance', description: 'Dance shake effect' },
    { value: 'video-love-drop', label: 'Love Drop', description: 'Romantic effect' },
    { value: 'video-jiggle-up', label: 'Jiggle Up', description: 'Jiggle animation' },
    { value: 'video-fishermen', label: 'Fishermen', description: 'Fishing effect' },
    { value: 'video-flying', label: 'Flying', description: 'Flying effect' },
    { value: 'video-gender-swap', label: 'Gender Swap', description: 'Gender transformation' },
    { value: 'video-hulk', label: 'Hulk', description: 'Hulk transformation' },
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
 * Check if a video model ID is valid
 */
export function isValidVideoModel(modelId: string): boolean {
  for (const models of Object.values(VIDEO_GENERATION_MODELS)) {
    if (models.some(m => m.value === modelId)) {
      return true;
    }
  }
  return false;
}

/**
 * Get image models filtered by reference support
 * @param requiresReference - if true, only return models that support reference images
 */
export function getFilteredImageModels(requiresReference: boolean) {
  const result: Record<string, Array<{ value: string; label: string; supportsReference: boolean; maxReferenceImages: number; supportsPrompt: boolean }>> = {};

  for (const [provider, models] of Object.entries(IMAGE_GENERATION_MODELS)) {
    const filtered = models.filter(m => !requiresReference || m.supportsReference);
    if (filtered.length > 0) {
      result[provider] = filtered as Array<{ value: string; label: string; supportsReference: boolean; maxReferenceImages: number; supportsPrompt: boolean }>;
    }
  }

  return result;
}

/**
 * Get flat list of all image models
 */
export function getAllImageModelsFlat() {
  const models: Array<{ value: string; label: string; supportsReference: boolean; maxReferenceImages: number; supportsPrompt: boolean; provider: string }> = [];

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
    // ===== TEXT-TO-VIDEO (Featured) =====
    'veo3.1-t2v': 'google/veo3.1/text-to-video',
    'veo3.1-fast-t2v': 'google/veo3.1-fast/text-to-video',
    'seedance-v1.5-pro-t2v': 'bytedance/seedance-v1.5-pro/text-to-video',
    'seedance-v1.5-pro-fast-t2v': 'bytedance/seedance-v1.5-pro-fast/text-to-video',
    'sora-2-t2v-pro': 'openai/sora-2/text-to-video-pro',
    'kling-2.6-pro-t2v': 'kwaivgi/kling-v2.6-pro/text-to-video',
    'kling-2.5-turbo-pro-t2v': 'kwaivgi/kling-v2.5-turbo-pro/text-to-video',
    'kling-video-o1-t2v': 'kwaivgi/kling-video-o1/text-to-video',

    // ===== TEXT-TO-VIDEO (Standard) =====
    'hailuo-2.3-t2v-pro': 'minimax/hailuo-2.3/t2v-pro',
    'hailuo-2.3-t2v-standard': 'minimax/hailuo-2.3/t2v-standard',
    'pixverse-4.5-t2v': 'pixverse/pixverse-v4.5-t2v',
    'pika-2.2-t2v': 'pika/v2.2-t2v',
    'pika-2.0-turbo-t2v': 'pika/v2.0-turbo-t2v',
    'ray-2-t2v': 'luma/ray-2-t2v',
    'ray-2-flash-t2v': 'luma/ray-2-flash-t2v',
    'hunyuan-video-t2v': 'hunyuan/hunyuan-video-t2v',
    'ltx-2-pro-t2v': 'lightricks/ltx-2-pro/text-to-video',
    'ltx-2-fast-t2v': 'lightricks/ltx-2-fast/text-to-video',
    'seedance-v1-pro-t2v-1080p': 'bytedance/seedance-v1-pro-t2v-1080p',
    'seedance-v1-pro-t2v-720p': 'bytedance/seedance-v1-pro-t2v-720p',
    'seedance-v1-pro-t2v-480p': 'bytedance/seedance-v1-pro-t2v-480p',

    // ===== TEXT-TO-VIDEO (Budget) =====
    'wan-2.6-t2v': 'alibaba/wan-2.6/text-to-video',
    'wan-2.5-t2v': 'alibaba/wan-2.5/text-to-video',
    'wan-2.5-fast-t2v': 'alibaba/wan-2.5/text-to-video-fast',
    'seedance-v1-pro-fast-t2v': 'bytedance/seedance-v1-pro-fast/text-to-video',
    'seedance-v1-lite-t2v-1080p': 'bytedance/seedance-v1-lite-t2v-1080p',
    'seedance-v1-lite-t2v-720p': 'bytedance/seedance-v1-lite-t2v-720p',
    'seedance-v1-lite-t2v-480p': 'bytedance/seedance-v1-lite-t2v-480p',

    // ===== FEATURED =====
    'sora-2-i2v-pro': 'openai/sora-2/image-to-video-pro',
    'sora-2-i2v': 'openai/sora-2/image-to-video',
    'veo3.1-i2v': 'google/veo3.1/image-to-video',
    'veo3-i2v': 'google/veo3/image-to-video',
    'seedance-v1.5-pro-i2v': 'bytedance/seedance-v1.5-pro/image-to-video',
    'seedance-v1.5-pro-fast-i2v': 'bytedance/seedance-v1.5-pro-fast/image-to-video',
    'kling-2.6-pro-i2v': 'kwaivgi/kling-v2.6-pro/image-to-video',

    // ===== PREMIUM =====
    'kling-video-o1-i2v': 'kwaivgi/kling-video-o1/image-to-video',
    'veo3.1-ref-i2v': 'google/veo3.1/reference-to-video',
    'veo2-i2v': 'google/veo2/image-to-video',
    'kling-2.5-turbo-pro-i2v': 'kwaivgi/kling-v2.5-turbo-pro/image-to-video',
    'kling-2.1-start-end-i2v': 'kwaivgi/kling-v2.1-i2v-pro/start-end-frame',
    'kling-2.0-master-i2v': 'kwaivgi/kling-v2.0-i2v-master',
    'hailuo-2.3-pro-i2v': 'minimax/hailuo-2.3/i2v-pro',
    'luma-ray-2-i2v': 'luma/ray-2-i2v',
    'vidu-ref-2.0-i2v': 'vidu/reference-to-video-2.0',
    'vidu-ref-q1-i2v': 'vidu/reference-to-video-q1',

    // ===== STANDARD =====
    'sora-2-i2v-pro-dev': 'openai/sora-2/image-to-video-pro-developer',
    'sora-2-i2v-dev': 'openai/sora-2/image-to-video-developer',
    'veo3.1-fast-i2v': 'google/veo3.1-fast/image-to-video',
    'veo3-fast-i2v': 'google/veo3-fast/image-to-video',
    'hailuo-2.3-standard-i2v': 'minimax/hailuo-2.3/i2v-standard',
    'hailuo-02-t2v-pro': 'minimax/hailuo-02/t2v-pro',
    'kling-1.6-multi-pro-i2v': 'kwaivgi/kling-v1.6-multi-i2v-pro',
    'kling-1.6-multi-std-i2v': 'kwaivgi/kling-v1.6-multi-i2v-standard',
    'ltx-2-pro-i2v': 'lightricks/ltx-2-pro/image-to-video',
    'vidu-start-end-2.0': 'vidu/start-end-to-video-2.0',
    'pika-2.0-turbo-i2v': 'pika/v2.0-turbo-i2v',
    'pixverse-4.5-fast-i2v': 'pixverse/pixverse-v4.5-i2v-fast',
    'magi-1-24b': 'atlascloud/magi-1-24b',

    // ===== BUDGET =====
    'wan-2.6-i2v': 'alibaba/wan-2.6/image-to-video',
    'wan-2.5-i2v': 'alibaba/wan-2.5/image-to-video',
    'wan-2.5-fast-i2v': 'alibaba/wan-2.5/image-to-video-fast',
    'wan-2.2-lora-i2v': 'alibaba/wan-2.2/i2v-5b-720p-lora',
    'ltx-2-fast-i2v': 'lightricks/ltx-2-fast/image-to-video',
    'ltx-video-097-i2v': 'atlascloud/ltx-video-v097/i2v-720p',
    'seedance-v1-pro-fast-i2v': 'bytedance/seedance-v1-pro-fast/image-to-video',
    'seedance-v1-pro-i2v-1080p': 'bytedance/seedance-v1-pro-i2v-1080p',
    'seedance-v1-pro-i2v-720p': 'bytedance/seedance-v1-pro-i2v-720p',
    'seedance-v1-pro-i2v-480p': 'bytedance/seedance-v1-pro-i2v-480p',
    'seedance-v1-lite-i2v-1080p': 'bytedance/seedance-v1-lite-i2v-1080p',
    'seedance-v1-lite-i2v-720p': 'bytedance/seedance-v1-lite-i2v-720p',
    'seedance-v1-lite-i2v-480p': 'bytedance/seedance-v1-lite-i2v-480p',
    'hailuo-2.3-fast-i2v': 'minimax/hailuo-2.3/fast',
    'kling-effects': 'kwaivgi/kling-effects',

    // ===== VIDEO EFFECTS =====
    'video-zoom-out': 'video-effects/zoom-out',
    'video-shake-dance': 'video-effects/shake-dance',
    'video-love-drop': 'video-effects/love-drop',
    'video-jiggle-up': 'video-effects/jiggle-up',
    'video-fishermen': 'video-effects/fishermen',
    'video-flying': 'video-effects/flying',
    'video-gender-swap': 'video-effects/gender-swap',
    'video-hulk': 'video-effects/hulk',
  };

  const mapped = modelMapping[internalId];
  if (!mapped) {
    console.warn(`[ModelMetadata] Unknown video model: "${internalId}", falling back to seedance-v1.5-pro-i2v`);
    // Return default model instead of passing through unknown model
    return 'bytedance/seedance-v1.5-pro/image-to-video';
  }
  return mapped;
}

/**
 * Map internal text-to-image model ID to AtlasCloud API model string
 */
export function getAtlasCloudImageModelId(internalId: string): string {
  const modelMapping: Record<string, string> = {
    // ===== FLUX =====
    'flux-1.1-pro-ultra': 'black-forest-labs/flux-1.1-pro-ultra',
    'flux-1.1-pro': 'black-forest-labs/flux-1.1-pro',
    'flux-dev': 'black-forest-labs/flux-dev',
    'flux-dev-ultra-fast': 'black-forest-labs/flux-dev-ultra-fast',
    'flux-dev-lora': 'black-forest-labs/flux-dev-lora',
    'flux-dev-lora-ultra-fast': 'black-forest-labs/flux-dev-lora-ultra-fast',
    'flux-schnell': 'black-forest-labs/flux-schnell',
    'flux-schnell-lora': 'black-forest-labs/flux-schnell-lora',
    'flux-krea-dev-lora-t2i': 'black-forest-labs/flux-krea-dev-lora',
    'flux-2-flex-t2i': 'black-forest-labs/flux-2-flex/text-to-image',

    // ===== SEEDREAM =====
    'seedream-4.5-t2i': 'bytedance/seedream-v4.5',
    'seedream-4.5-seq-t2i': 'bytedance/seedream-v4.5/sequential',
    'seedream-4-t2i': 'bytedance/seedream-v4',
    'seedream-4-seq-t2i': 'bytedance/seedream-v4/sequential',
    'seedream-3.1-t2i': 'bytedance/seedream-v3.1',
    'seedream-3-t2i': 'bytedance/seedream-v3',

    // ===== IMAGEN =====
    'imagen4-ultra': 'google/imagen4-ultra',
    'imagen4': 'google/imagen4',
    'imagen4-fast': 'google/imagen4-fast',
    'atlascloud-imagen4': 'atlascloud/imagen4',
    'imagen3': 'google/imagen3',
    'imagen3-fast': 'google/imagen3-fast',

    // ===== NANO BANANA =====
    'nano-banana-pro-t2i-ultra': 'google/nano-banana-pro/text-to-image-ultra',
    'nano-banana-pro-t2i': 'google/nano-banana-pro/text-to-image',
    'nano-banana-pro-t2i-dev': 'google/nano-banana-pro/text-to-image-developer',
    'nano-banana-t2i': 'google/nano-banana/text-to-image',
    'nano-banana-t2i-dev': 'google/nano-banana/text-to-image-developer',
    'gemini-2.5-flash-t2i': 'google/gemini-2.5-flash-image/text-to-image',
    'gemini-2.5-flash-t2i-dev': 'google/gemini-2.5-flash-image/text-to-image-developer',

    // ===== IDEOGRAM =====
    'ideogram-v3-quality': 'ideogram-ai/ideogram-v3-quality',
    'ideogram-v3-balanced': 'ideogram-ai/ideogram-v3-balanced',
    'ideogram-v3-turbo': 'ideogram-ai/ideogram-v3-turbo',
    'ideogram-v2': 'ideogram-ai/ideogram-v2',
    'ideogram-v2-turbo': 'ideogram-ai/ideogram-v2-turbo',
    'ideogram-v2a-turbo': 'ideogram-ai/ideogram-v2a-turbo',

    // ===== RECRAFT =====
    'recraft-v3': 'recraft-ai/recraft-v3',
    'recraft-v3-svg': 'recraft-ai/recraft-v3-svg',
    'recraft-20b': 'recraft-ai/recraft-20b',
    'recraft-20b-svg': 'recraft-ai/recraft-20b-svg',

    // ===== WAN =====
    'wan-2.6-t2i': 'alibaba/wan-2.6/text-to-image',
    'wan-2.5-t2i': 'alibaba/wan-2.5/text-to-image',
    'wan-2.1-t2i': 'alibaba/wan-2.1/text-to-image',
    'wan-2.1-t2i-lora': 'alibaba/wan-2.1/text-to-image-lora',

    // ===== LUMA =====
    'photon-t2i': 'luma/photon',
    'photon-flash-t2i': 'luma/photon-flash',

    // ===== ATLASCLOUD =====
    'hunyuan-image-3': 'atlascloud/hunyuan-image-3',
    'neta-lumina': 'atlascloud/neta-lumina',
    'qwen-t2i': 'atlascloud/qwen-image/text-to-image',
    'hidream-i1-full': 'atlascloud/hidream-i1-full',
    'hidream-i1-dev': 'atlascloud/hidream-i1-dev',

    // ===== Z-IMAGE =====
    'z-image-turbo': 'z-image/turbo',
    'z-image-turbo-lora': 'z-image/turbo-lora',
  };

  return modelMapping[internalId] || internalId;
}
