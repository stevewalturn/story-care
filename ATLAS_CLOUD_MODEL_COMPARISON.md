# Atlas Cloud Model API Parameter Comparison

This document compares the expected API parameters from `TEXT_TO_IMAGE.md` documentation with the implementation in `src/libs/providers/AtlasCloud.ts`.

## Legend
- **Matching** = Implementation matches documentation
- **Fixed** = Recently fixed to match documentation
- **Family** = Model family used for parameter building

---

## Text-to-Image Models

### ByteDance Seedream Models

| Model | API Name | Doc Size | Code Size | Status |
|-------|----------|----------|-----------|--------|
| `seedream-4.5-t2i` | `bytedance/seedream-v4.5` | `2048*2048` | `2048*2048` | Fixed |
| `seedream-4.5-seq-t2i` | `bytedance/seedream-v4.5/sequential` | `2048*2048` | `2048*2048` | Fixed |
| `seedream-4-t2i` | `bytedance/seedream-v4` | `2048*2048` | `2048*2048` | Fixed |
| `seedream-4-seq-t2i` | `bytedance/seedream-v4/sequential` | `2048*2048` | `2048*2048` | Fixed |
| `seedream-3.1-t2i` | `bytedance/seedream-v3.1` | `1024*1024` | `1024*1024` | Matching |
| `seedream-3-t2i` | `bytedance/seedream-v3` | `1024*1024` | `1024*1024` | Matching |

**Seedream Family Parameters:**
| Parameter | Documentation | Implementation |
|-----------|---------------|----------------|
| `model` | Required | Yes |
| `prompt` | Required | Yes |
| `size` | `2048*2048` (v4+) / `1024*1024` (v3) | Yes |
| `enable_base64_output` | `false` | Yes |
| `seed` | Optional | Yes |
| `enable_sync_mode` | Optional | Yes |
| `max_images` | For sequential only | Not implemented |

---

### Google Nano Banana Models

| Model | API Name | Status |
|-------|----------|--------|
| `nano-banana-pro-t2i-ultra` | `google/nano-banana-pro/text-to-image-ultra` | Matching |
| `nano-banana-pro-t2i` | `google/nano-banana-pro/text-to-image` | Matching |
| `nano-banana-pro-t2i-dev` | `google/nano-banana-pro/text-to-image-developer` | Matching |
| `nano-banana-t2i` | `google/nano-banana/text-to-image` | Matching |
| `nano-banana-t2i-dev` | `google/nano-banana/text-to-image-developer` | Matching |

**Nano Banana Family Parameters:**
| Parameter | Documentation | Implementation |
|-----------|---------------|----------------|
| `model` | Required | Yes |
| `prompt` | Required | Yes |
| `aspect_ratio` | e.g., `"3:4"`, `"1:1"` | `"1:1"` |
| `output_format` | `"png"` | Yes |
| `resolution` | `"1k"`, `"2k"`, `"4k"` | `"1k"` |
| `enable_base64_output` | `false` | Yes |
| `enable_sync_mode` | `false` | Yes |

---

### Google Gemini Image Models

| Model | API Name | Status |
|-------|----------|--------|
| `gemini-2.5-flash-t2i` | `google/gemini-2.5-flash-image/text-to-image` | Matching |
| `gemini-2.5-flash-t2i-dev` | `google/gemini-2.5-flash-image/text-to-image-developer` | Matching |

**Gemini Image Family Parameters:**
| Parameter | Documentation | Implementation |
|-----------|---------------|----------------|
| `model` | Required | Yes |
| `prompt` | Required | Yes |
| `aspect_ratio` | e.g., `"16:9"`, `"2:3"` | `"16:9"` |
| `output_format` | `"png"` | Yes |
| `enable_base64_output` | `false` | Yes |
| `enable_sync_mode` | `false` | Yes |

---

### Google Imagen Models

| Model | API Name | Status |
|-------|----------|--------|
| `imagen4-ultra` | `google/imagen4-ultra` | Matching |
| `imagen4` | `google/imagen4` | Matching |
| `imagen4-fast` | `google/imagen4-fast` | Matching |
| `imagen3` | `google/imagen3` | Matching |
| `imagen3-fast` | `google/imagen3-fast` | Matching |

**Imagen Family Parameters:**
| Parameter | Documentation | Implementation |
|-----------|---------------|----------------|
| `model` | Required | Yes |
| `prompt` | Required | Yes |
| `seed` | `1` | Yes |
| `num_images` | `1` | Yes |
| `aspect_ratio` | `"1:1"`, `"16:9"` | `"1:1"` |
| `negative_prompt` | `""` | Yes |
| `enable_base64_output` | `false` | Yes |

---

### AtlasCloud Imagen4

| Model | API Name | Status |
|-------|----------|--------|
| `atlascloud-imagen4` | `atlascloud/imagen4` | Fixed |

**AtlasCloud Imagen Family Parameters (Different from Google Imagen):**
| Parameter | Documentation | Implementation |
|-----------|---------------|----------------|
| `model` | Required | Yes |
| `prompt` | Required | Yes |
| `seed` | `1` | Yes |
| `aspect_ratio` | `"1:1"` | Yes |
| `output_format` | `"png"` | Yes (Fixed) |
| `enable_base64_output` | `false` | Yes |
| `num_images` | NOT used | NOT sent (Fixed) |
| `negative_prompt` | NOT used | NOT sent (Fixed) |

---

### Alibaba Wan Models

| Model | API Name | Doc Size | Code Size | Status |
|-------|----------|----------|-----------|--------|
| `wan-2.6-t2i` | `alibaba/wan-2.6/text-to-image` | `1280*1280` | `1280*1280` | Fixed |
| `wan-2.5-t2i` | `alibaba/wan-2.5/text-to-image` | `1280*1280` | `1280*1280` | Fixed |
| `wan-2.1-t2i` | `alibaba/wan-2.1/text-to-image` | `1024*1024` | `1024*1024` | Matching |

**Wan Family Parameters:**
| Parameter | Documentation | Implementation |
|-----------|---------------|----------------|
| `model` | Required | Yes |
| `prompt` | Required | Yes |
| `seed` | `-1` or `0` | `-1` |
| `size` | `1280*1280` (2.5+) / `1024*1024` (2.1) | Yes (Fixed) |
| `negative_prompt` | `""` | Yes |
| `enable_prompt_expansion` | `false` | Yes |
| `enable_base64_output` | `false` | Yes |
| `enable_sync_mode` | `false` | Yes |

---

### Z-Image Models

| Model | API Name | Status |
|-------|----------|--------|
| `z-image-turbo` | `z-image/turbo` | Matching |
| `z-image-turbo-lora` | `z-image/turbo-lora` | Fixed |

**Z-Image Family Parameters:**
| Parameter | Documentation | Implementation |
|-----------|---------------|----------------|
| `model` | Required | Yes |
| `prompt` | Required | Yes |
| `seed` | `-1` | Yes |
| `size` | `1024*1024` | Yes |
| `enable_base64_output` | `false` | Yes |
| `enable_sync_mode` | `false` | Yes |
| `loras` | `[]` (only for turbo-lora) | Yes (Fixed) |

---

### Recraft Models

| Model | API Name | Status |
|-------|----------|--------|
| `recraft-v3` | `recraft-ai/recraft-v3` | Matching |
| `recraft-v3-svg` | `recraft-ai/recraft-v3-svg` | Matching |
| `recraft-20b` | `recraft-ai/recraft-20b` | Matching |
| `recraft-20b-svg` | `recraft-ai/recraft-20b-svg` | Matching |

**Recraft Family Parameters:**
| Parameter | Documentation | Implementation |
|-----------|---------------|----------------|
| `model` | Required | Yes |
| `prompt` | Required | Yes |
| `style` | e.g., `"realistic_image"`, `"vector_illustration"` | `"realistic_image"` |
| `aspect_ratio` | `"1:1"` | Yes |
| `enable_base64_output` | `false` | Yes |

---

### Ideogram Models

| Model | API Name | Status |
|-------|----------|--------|
| `ideogram-v3-quality` | `ideogram-ai/ideogram-v3-quality` | Matching |
| `ideogram-v3-balanced` | `ideogram-ai/ideogram-v3-balanced` | Matching |
| `ideogram-v3-turbo` | `ideogram-ai/ideogram-v3-turbo` | Matching |
| `ideogram-v2` | `ideogram-ai/ideogram-v2` | Matching |
| `ideogram-v2-turbo` | `ideogram-ai/ideogram-v2-turbo` | Matching |
| `ideogram-v2a-turbo` | `ideogram-ai/ideogram-v2a-turbo` | Matching |

**Ideogram Family Parameters:**
| Parameter | Documentation | Implementation |
|-----------|---------------|----------------|
| `model` | Required | Yes |
| `prompt` | Required | Yes |
| `style` | `"Auto"` | Yes |
| `aspect_ratio` | `"1:1"` | Yes |
| `enable_base64_output` | `false` | Yes |
| `image` | Optional | Via `addReferenceImages()` |
| `mask_image` | Optional | Not implemented |
| `reference_images` | For v3 only | Not implemented |

---

### Luma Photon Models

| Model | API Name | Status |
|-------|----------|--------|
| `photon-t2i` | `luma/photon` | Matching |
| `photon-flash-t2i` | `luma/photon-flash` | Matching |

**Photon Family Parameters (Minimal):**
| Parameter | Documentation | Implementation |
|-----------|---------------|----------------|
| `model` | Required | Yes |
| `prompt` | Required | Yes |
| `enable_base64_output` | `false` | Yes |

---

### AtlasCloud Generic Models

| Model | API Name | Status |
|-------|----------|--------|
| `hunyuan-image-3` | `atlascloud/hunyuan-image-3` | Matching |
| `neta-lumina` | `atlascloud/neta-lumina` | Matching |
| `qwen-t2i` | `atlascloud/qwen-image/text-to-image` | Matching |
| `hidream-i1-full` | `atlascloud/hidream-i1-full` | Matching |
| `hidream-i1-dev` | `atlascloud/hidream-i1-dev` | Matching |

**AtlasCloud Generic Family Parameters:**
| Parameter | Documentation | Implementation |
|-----------|---------------|----------------|
| `model` | Required | Yes |
| `prompt` | Required | Yes |
| `seed` | `-1` | Yes |
| `size` | `1024*1024` | Yes |
| `output_format` | `"jpeg"` | Yes |
| `enable_base64_output` | `false` | Yes |
| `enable_sync_mode` | `false` | Yes |
| `enable_safety_checker` | `true` | Yes |

---

### Flux Standard Models (dev, schnell)

| Model | API Name | Status |
|-------|----------|--------|
| `flux-schnell` | `black-forest-labs/flux-schnell` | Matching |
| `flux-dev` | `black-forest-labs/flux-dev` | Matching |
| `flux-dev-ultra-fast` | `black-forest-labs/flux-dev-ultra-fast` | Matching |

**Flux Standard Family Parameters:**
| Parameter | Documentation | Implementation |
|-----------|---------------|----------------|
| `model` | Required | Yes |
| `prompt` | Required | Yes |
| `seed` | `-1` | Yes |
| `size` | `1024*1024` | Yes |
| `num_images` | `1` | Yes |
| `guidance_scale` | `3.5` | Yes |
| `num_inference_steps` | `28` (dev) / `4` (schnell) | Yes |
| `enable_base64_output` | `false` | Yes |
| `enable_safety_checker` | `true` | Yes |
| `enable_sync_mode` | `false` | Yes |
| `image` | Optional | Via `addReferenceImages()` |
| `strength` | Optional | Not implemented |
| `mask_image` | Optional | Not implemented |

---

### Flux LoRA Models

| Model | API Name | Status |
|-------|----------|--------|
| `flux-dev-lora` | `black-forest-labs/flux-dev-lora` | Matching |
| `flux-dev-lora-ultra-fast` | `black-forest-labs/flux-dev-lora-ultra-fast` | Matching |
| `flux-schnell-lora` | `black-forest-labs/flux-schnell-lora` | Matching |
| `flux-krea-dev-lora-t2i` | `black-forest-labs/flux-krea-dev-lora` | Matching |

**Flux LoRA Family Parameters:**
| Parameter | Documentation | Implementation |
|-----------|---------------|----------------|
| `model` | Required | Yes |
| `prompt` | Required | Yes |
| `seed` | `-1` | Yes |
| `size` | `1024*1024` | Yes |
| `loras` | `[]` | Yes |
| `strength` | `0.8` | Yes |
| `num_images` | `1` | Yes |
| `guidance_scale` | `3.5` | Yes |
| `num_inference_steps` | `28` | Yes |
| `enable_base64_output` | `false` | Yes |
| `enable_safety_checker` | `true` | Yes |
| `image` | Optional | Via `addReferenceImages()` |

---

### Flux 1.1 Pro Models

| Model | API Name | Status |
|-------|----------|--------|
| `flux-1.1-pro` | `black-forest-labs/flux-1.1-pro` | Matching |
| `flux-1.1-pro-ultra` | `black-forest-labs/flux-1.1-pro-ultra` | Matching |

**Flux 1.1 Pro Family Parameters:**
| Parameter | Documentation | Implementation |
|-----------|---------------|----------------|
| `model` | Required | Yes |
| `prompt` | Required | Yes |
| `seed` | `1` | Yes |
| `aspect_ratio` | `"1:1"` | Yes |
| `output_format` | `"jpg"` | Yes |
| `enable_base64_output` | `false` | Yes |
| `raw` | `false` (optional, for ultra) | Not implemented |

---

### Flux Kontext Text-to-Image Models

| Model | API Name | Status |
|-------|----------|--------|
| `flux-kontext-max-t2i` | `black-forest-labs/flux-kontext-max/text-to-image` | Fixed |
| `flux-kontext-pro-t2i` | `black-forest-labs/flux-kontext-pro/text-to-image` | Fixed |

**Flux Kontext Family Parameters:**
| Parameter | Documentation | Implementation |
|-----------|---------------|----------------|
| `model` | Required | Yes |
| `prompt` | Required | Yes |
| `seed` | `1` | Yes |
| `num_images` | `1` | Yes |
| `aspect_ratio` | `"1:1"` | Yes (Fixed) |
| `guidance_scale` | `3.5` | Yes |
| `safety_tolerance` | `"2"` | Yes (Fixed) |
| `image` | For I2I variant | Via `addReferenceImages()` |

**Key Fixes for Flux Kontext:**
- Changed from `size` to `aspect_ratio`
- Changed from `enable_safety_checker` to `safety_tolerance`
- Removed `num_inference_steps`, `output_format`, `enable_sync_mode`

---

## Image-to-Image Models

### Flux Kontext I2I Models

| Model | API Name | Requires Image | Status |
|-------|----------|----------------|--------|
| `flux-kontext-max` | `black-forest-labs/flux-kontext-max` | Yes | Fixed |
| `flux-kontext-pro` | `black-forest-labs/flux-kontext-pro` | Yes | Fixed |
| `flux-kontext-dev` | `black-forest-labs/flux-kontext-dev` | Yes | Matching |
| `flux-kontext-dev-ultra-fast` | `black-forest-labs/flux-kontext-dev-ultra-fast` | Yes | Matching |

**Parameters for I2I (same as T2I + image field):**
| Parameter | Implementation |
|-----------|----------------|
| `image` | Single reference image URL |
| All Kontext T2I params | Same as above |

---

## Summary of Changes Made

### Fixed Parameter Formats
1. **Flux Kontext models**: Now use `aspect_ratio` and `safety_tolerance` instead of `size` and `enable_safety_checker`
2. **Flux 1.1 Pro models**: Now use `aspect_ratio` and `output_format` instead of `size`
3. **AtlasCloud Imagen4**: Now uses correct params without `num_images` and `negative_prompt`
4. **Z-Image turbo-lora**: Now includes `loras: []` array

### Fixed Model Sizes
1. **Seedream v4/v4.5**: Changed from `1024*1024` to `2048*2048`
2. **Wan v2.5/v2.6**: Changed from `1024*1024` to `1280*1280`

### Model Family Routing
1. **qwen-t2i**: Now correctly routed to `atlascloud` family instead of `wan`
2. **atlascloud-imagen4**: Now has its own family with different params than Google Imagen

---

## How Model Families Work

The `buildModelRequestBody()` function in `AtlasCloud.ts` uses the model family to determine which parameters to send:

```typescript
type ModelFamily =
  | 'flux-kontext'      // aspect_ratio, safety_tolerance
  | 'flux-1.1-pro'      // aspect_ratio, output_format
  | 'flux-standard'     // size, num_inference_steps, guidance_scale
  | 'flux-lora'         // size, loras array
  | 'imagen'            // aspect_ratio, negative_prompt, num_images
  | 'atlascloud-imagen' // aspect_ratio, output_format (no negative_prompt)
  | 'nano-banana'       // aspect_ratio, resolution, output_format
  | 'gemini-image'      // aspect_ratio, output_format
  | 'recraft'           // aspect_ratio, style
  | 'ideogram'          // aspect_ratio, style
  | 'photon'            // minimal (just prompt)
  | 'seedream'          // size, enable_prompt_expansion
  | 'wan'               // size, negative_prompt
  | 'atlascloud'        // size, enable_safety_checker
  | 'z-image'           // size, loras
  | 'style-transfer';   // image, minimal params
```

---

*Last updated: 2026-01-13*
*Source files: `TEXT_TO_IMAGE.md`, `src/libs/providers/AtlasCloud.ts`*
