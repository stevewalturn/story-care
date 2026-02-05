# Atlas Cloud Image-to-Image Model Comparison

Comparison of IMAGE_TO_IMAGE.md documentation vs AtlasCloud.ts implementation.

## Summary

- **Total Models Documented**: 54+
- **Model Families**: 10+ (Flux, WAN, Seedream, Nano-Banana, etc.)
- **Key Finding**: Many models have different parameter requirements

---

## Flux Kontext Family (Critical - Fixed)

| Model | Doc Params | Implementation | Status |
|-------|-----------|----------------|--------|
| `flux-kontext-max` | seed, image, prompt, guidance_scale, safety_tolerance | Fixed: Only basic params | **Fixed** |
| `flux-kontext-pro` | image, prompt, guidance_scale, safety_tolerance | Fixed: Only basic params | **Fixed** |
| `flux-kontext-dev` | seed, size, image, prompt, num_images, guidance_scale, num_inference_steps, enable_base64_output, enable_safety_checker | Extended params | OK |
| `flux-kontext-dev-ultra-fast` | seed, size, image, prompt, num_images, guidance_scale, num_inference_steps, enable_base64_output, enable_safety_checker | Extended params | OK |
| `flux-kontext-dev-lora` | enable_base64_output, enable_sync_mode, guidance_scale, image, loras, num_images, num_inference_steps, output_format, prompt, seed, size | Extended + loras | OK |
| `flux-kontext-dev-lora-ultra-fast` | seed, size, image, loras, prompt, num_images, guidance_scale, num_inference_steps, enable_base64_output, enable_safety_checker | Extended + loras | OK |
| `flux-kontext-max/multi` | images[], prompt, guidance_scale, safety_tolerance | Multi: uses images array | OK |
| `flux-kontext-pro/multi` | seed, images[], prompt, guidance_scale, safety_tolerance | Multi: uses images array | OK |
| `flux-kontext-dev/multi` | seed, size, images[], prompt, num_images, guidance_scale, num_inference_steps, enable_base64_output, enable_safety_checker | Multi: uses images array | OK |
| `flux-kontext-dev/multi-ultra-fast` | seed, size, images[], prompt, num_images, guidance_scale, num_inference_steps, enable_base64_output, enable_safety_checker | Multi: uses images array | OK |

### Key Fix Applied
- **flux-kontext-max** and **flux-kontext-pro** now use minimal params (no `aspect_ratio`, no `num_images`)
- Split into separate model families: `flux-kontext-max-pro`, `flux-kontext-dev`, `flux-kontext-multi`

---

## Flux Redux Family

| Model | Doc Params | Implementation | Status |
|-------|-----------|----------------|--------|
| `flux-redux-dev` | seed, size, image, num_images, output_format, guidance_scale, enable_sync_mode, num_inference_steps, enable_base64_output, enable_safety_checker | Uses flux-standard family | **Need Audit** |
| `flux-redux-pro` | seed, size, image, prompt, num_images, guidance_scale, num_inference_steps, enable_safety_checker | Uses flux-standard family | **Need Audit** |

---

## Flux 2 Edit Family

| Model | Doc Params | Implementation | Status |
|-------|-----------|----------------|--------|
| `flux-2-dev/edit` | enable_base64_output, images[], prompt, seed, size | Uses flux-standard | **Need Audit** |
| `flux-2-pro/edit` | enable_base64_output, images[], prompt, seed, size | Uses flux-standard | **Need Audit** |
| `flux-2-flex/edit` | enable_base64_output, images[], prompt, seed, size | Uses flux-standard | **Need Audit** |

---

## Flux Special Family

| Model | Doc Params | Implementation | Status |
|-------|-----------|----------------|--------|
| `flux-controlnet-union-pro-2.0` | seed, size, loras, prompt, num_images, control_image, output_format, guidance_scale, enable_sync_mode, num_inference_steps, control_guidance_end, enable_base64_output, enable_safety_checker, control_guidance_start, controlnet_conditioning_scale | Has ControlNet-specific params | **Need Audit** |
| `flux-fill-dev` | seed, size, image, loras, prompt, mask_image, num_images, guidance_scale, num_inference_steps, enable_safety_checker | Has mask_image param | **Need Audit** |
| `flux-krea-dev-lora` | seed, size, image, loras, prompt, strength, output_format, guidance_scale, enable_sync_mode, enable_base64_output | Has strength param | **Need Audit** |

---

## Alibaba WAN Family

| Model | Doc Params | Implementation | Status |
|-------|-----------|----------------|--------|
| `wan-2.6/image-edit` | enable_prompt_expansion, enable_base64_output, enable_sync_mode, images[], prompt, negative_prompt, seed, size | Uses 'wan' family | **Need Audit** |
| `wan-2.5/image-edit` | images[], prompt, negative_prompt, seed, size, enable_prompt_expansion | Uses 'wan' family | **Need Audit** |
| `wan-2.1/text-to-image-lora` | seed, size, image, loras, prompt, strength, output_format, enable_sync_mode, enable_base64_output, enable_safety_checker | Uses 'wan' family | **Need Audit** |

---

## ByteDance Seedream Family

| Model | Doc Params | Implementation | Status |
|-------|-----------|----------------|--------|
| `seedream-v4.5/edit` | enable_base64_output, images[], prompt, size | Uses 'seedream' family | OK |
| `seedream-v4.5/edit-sequential` | enable_base64_output, images[], max_images, prompt, size | Has max_images | **Need Audit** |
| `seedream-v4/edit` | enable_base64_output, images[], prompt, size | Uses 'seedream' family | OK |
| `seedream-v4/edit-sequential` | enable_base64_output, images[], max_images, prompt, size | Has max_images | **Need Audit** |
| `seededit-v3` | seed, image, prompt, guidance_scale, enable_base64_output | Uses 'seedream' family | **Need Audit** |
| `portrait` | seed, image, prompt, enable_base64_output | Uses 'seedream' family | **Need Audit** |

---

## Google Nano-Banana Family

| Model | Doc Params | Implementation | Status |
|-------|-----------|----------------|--------|
| `nano-banana-pro/edit` | aspect_ratio, enable_base64_output, enable_sync_mode, images[], output_format, prompt, resolution | Uses 'nano-banana' family | OK |
| `nano-banana-pro/edit-ultra` | aspect_ratio, enable_base64_output, enable_sync_mode, images[], output_format, prompt, resolution | Uses 'nano-banana' family | OK |
| `nano-banana/edit-developer` | aspect_ratio, images[], prompt, enable_base64_output, enable_sync_mode, output_format | Uses 'nano-banana' family | OK |
| `nano-banana-pro/edit-developer` | aspect_ratio, enable_base64_output, enable_sync_mode, images[], output_format, prompt, resolution | Uses 'nano-banana' family | OK |
| `nano-banana/edit` | aspect_ratio, images[], prompt, enable_base64_output, enable_sync_mode, output_format | Uses 'nano-banana' family | OK |

---

## Luma Photon Family

| Model | Doc Params | Implementation | Status |
|-------|-----------|----------------|--------|
| `photon-modify` | image, prompt, enable_base64_output | Uses 'photon' family | OK |
| `photon-flash-modify` | image, prompt, enable_base64_output | Uses 'photon' family | OK |

---

## AtlasCloud Proprietary Models

| Model | Doc Params | Implementation | Status |
|-------|-----------|----------------|--------|
| `ghibli` | image, output_format, enable_sync_mode, enable_base64_output, enable_safety_checker | Uses 'style-transfer' family | **Need Audit** |
| `real-esrgan` | image, scale, face_enhance | Special model (upscale) | **Not Implemented** |
| `instant-character` | seed, size, image, prompt | Special model | **Not Implemented** |
| `qwen-image/edit` | enable_base64_output, enable_sync_mode, image, output_format, prompt, seed | Uses 'wan' family | **Need Audit** |
| `qwen-image/edit-plus` | enable_base64_output, enable_sync_mode, images[], output_format, prompt, seed, size | Uses 'wan' family | **Need Audit** |
| `step1x-edit` | seed, image, prompt, guidance_scale, negative_prompt, num_inference_steps, enable_safety_checker | Special model | **Not Implemented** |
| `image-zoom-out` | size, image, output_format, enable_sync_mode, enable_base64_output | Special model | **Not Implemented** |
| `image-watermark-remover` | image, output_format, enable_sync_mode, enable_base64_output | Special model | **Not Implemented** |
| `hidream-e1-full` | seed, image, prompt, output_format, enable_base64_output, enable_safety_checker | Uses 'atlascloud' family | **Need Audit** |

---

## Image Effects Family

| Model | Doc Params | Implementation | Status |
|-------|-----------|----------------|--------|
| `micro-landscape-mini-world` | image, enable_base64_output | Uses 'style-transfer' family | OK |
| `my-world` | image, enable_base64_output | Uses 'style-transfer' family | OK |
| `plastic-bubble-figure` | image, enable_base64_output | Uses 'style-transfer' family | OK |
| `glass-ball` | image, enable_base64_output | Uses 'style-transfer' family | OK |
| `felt-keychain` | image, enable_base64_output | Uses 'style-transfer' family | OK |
| `felt-3d-polaroid` | image, enable_base64_output | Uses 'style-transfer' family | OK |
| `advanced-photography` | image, enable_base64_output | Uses 'style-transfer' family | OK |
| `american-comic-style` | image, enable_base64_output | Uses 'style-transfer' family | OK |

---

## Recraft AI Family

| Model | Doc Params | Implementation | Status |
|-------|-----------|----------------|--------|
| `recraft-crisp-upscale` | image, enable_base64_output | Special model (upscale) | **Not Implemented** |
| `recraft-creative-upscale` | image, enable_base64_output | Special model (upscale) | **Not Implemented** |

---

## Changes Made in This Fix

### 1. Split flux-kontext into sub-families

**Before**: All flux-kontext models used same `flux-kontext` family
**After**:
- `flux-kontext-max-pro` - Max/Pro use ONLY basic params
- `flux-kontext-dev` - Dev variants use extended params
- `flux-kontext-multi` - Multi variants use images array

### 2. Updated getModelFamily()

```typescript
if (model === 'flux-kontext-max' || model === 'flux-kontext-pro') {
  return 'flux-kontext-max-pro';
}
if (model.includes('-multi')) {
  return 'flux-kontext-multi';
}
if (model.startsWith('flux-kontext-dev') || model.startsWith('flux-kontext')) {
  return 'flux-kontext-dev';
}
```

### 3. Updated buildModelRequestBody()

**flux-kontext-max-pro**:
```typescript
{
  model: atlasName,
  prompt: prompt,
  seed: 1,
  guidance_scale: 3.5,
  safety_tolerance: '2',
  image: referenceImage
}
```

**flux-kontext-dev**:
```typescript
{
  model: atlasName,
  prompt: prompt,
  enable_base64_output: false,
  seed: -1,
  size: '1024*1024',
  num_images: 1,
  guidance_scale: 2.5,
  num_inference_steps: 28,
  enable_safety_checker: true,
  image: referenceImage
}
```

---

## Remaining Work

Models marked as **Need Audit** or **Not Implemented** may require additional parameter adjustments. The most common issues are:

1. Missing model-specific parameters (e.g., `loras`, `mask_image`, `control_image`)
2. Using wrong parameter names or formats
3. Including parameters the API doesn't accept

---

*Generated: 2026-01-13*
*Reference: IMAGE_TO_IMAGE.md, AtlasCloud.ts*
