# Atlas Cloud Image-to-Video Model Comparison

Comparison of IMAGE_TO_VIDEO.md documentation vs AtlasCloud.ts implementation.

## Summary

- **Total Models Documented**: 30+
- **Model Families**: 7+ (Seedance, Kling, Veo, Sora, Hailuo, Luma, Vidu)
- **Critical Finding**: Current implementation sends same params for ALL models (model, prompt, image, duration, seed)

---

## Current Implementation Issues

The current `generateVideoWithAtlas()` function sends ONLY these parameters:
```typescript
{
  model: atlasModel,
  prompt: options.prompt,
  image: options.referenceImage || '',
  duration: options.duration || 5,
  seed: options.seed ?? -1  // Excluded for Sora
}
```

But different model families need DIFFERENT parameters!

---

## Seedance Family (ByteDance) - CRITICAL

| Model | Doc Params | Current Impl | Status |
|-------|-----------|--------------|--------|
| `seedance-v1.5-pro/image-to-video` | image, prompt, aspect_ratio, camera_fixed, duration, generate_audio, last_image, resolution, seed | Missing: aspect_ratio, camera_fixed, generate_audio, resolution | **NEEDS FIX** |
| `seedance-v1-pro-fast/image-to-video` | image, prompt, aspect_ratio, camera_fixed, duration, resolution, seed | Missing: aspect_ratio, camera_fixed, resolution | **NEEDS FIX** |

### Required Params for Seedance:
```typescript
{
  model: "bytedance/seedance-v1.5-pro/image-to-video",
  image: string,
  prompt: string,
  aspect_ratio: "16:9",
  camera_fixed: false,
  duration: 5,
  generate_audio: true,
  last_image: string (optional),
  resolution: "720p",
  seed: -1
}
```

---

## Kling Family (Kuaishou) - CRITICAL

| Model | Doc Params | Current Impl | Status |
|-------|-----------|--------------|--------|
| `kling-v2.6-pro/image-to-video` | image, prompt, cfg_scale, duration, negative_prompt, sound | Missing: cfg_scale, negative_prompt, sound | **NEEDS FIX** |
| `kling-video-o1/image-to-video` | image, prompt, aspect_ratio, duration, last_image | Missing: aspect_ratio | **NEEDS FIX** |
| `kling-v2.5-turbo-pro/image-to-video` | image, prompt, duration, guidance_scale, last_image, negative_prompt | Missing: guidance_scale, negative_prompt | **NEEDS FIX** |
| `kling-v2.1-i2v-pro/start-end-frame` | image, end_image, prompt, duration, guidance_scale, negative_prompt | Missing: end_image (REQUIRED), guidance_scale, negative_prompt | **NEEDS FIX** |
| `kling-v1.6-multi-i2v-pro` | images[], prompt, aspect_ratio, duration, negative_prompt | Uses `image` instead of `images[]` | **NEEDS FIX** |
| `kling-effects` | image, effect_scene | Uses wrong params (prompt not needed) | **NEEDS FIX** |

### Required Params for Kling-v2.6-pro:
```typescript
{
  model: "kwaivgi/kling-v2.6-pro/image-to-video",
  image: string,
  prompt: string,
  cfg_scale: 0.5,
  duration: 5,
  negative_prompt: "",
  sound: true
}
```

---

## Veo Family (Google) - CRITICAL

| Model | Doc Params | Current Impl | Status |
|-------|-----------|--------------|--------|
| `veo3.1/reference-to-video` | images[], prompt, generate_audio, negative_prompt, resolution, seed | Uses `image` instead of `images[]` | **NEEDS FIX** |
| `veo3.1/image-to-video` | image, prompt, aspect_ratio, duration, generate_audio, last_image, negative_prompt, resolution, seed | Missing: aspect_ratio, generate_audio, resolution, negative_prompt | **NEEDS FIX** |
| `veo3.1-fast/image-to-video` | image, prompt, aspect_ratio, duration, generate_audio, last_image, negative_prompt, resolution, seed | Missing: aspect_ratio, generate_audio, resolution, negative_prompt | **NEEDS FIX** |
| `veo3/image-to-video` | image, prompt, duration, resolution, aspect_ratio, seed, generate_audio, negative_prompt | Missing: resolution, aspect_ratio, generate_audio, negative_prompt | **NEEDS FIX** |
| `veo2/image-to-video` | image, prompt, duration, resolution, aspect_ratio, seed, negative_prompt, enable_prompt_expansion | Missing: resolution, aspect_ratio, negative_prompt, enable_prompt_expansion | **NEEDS FIX** |

### Required Params for Veo3.1:
```typescript
{
  model: "google/veo3.1/image-to-video",
  image: string,
  prompt: string,
  aspect_ratio: "16:9",
  duration: 8,
  generate_audio: true,
  last_image: string (optional),
  negative_prompt: "",
  resolution: "1080p",
  seed: 1
}
```

---

## Sora Family (OpenAI) - CRITICAL

| Model | Doc Params | Current Impl | Status |
|-------|-----------|--------------|--------|
| `sora-2/image-to-video-pro` | image, prompt, duration | OK (only basic params needed) | OK |
| `sora-2/image-to-video` | image, prompt, duration | OK | OK |
| `sora-2/image-to-video-developer` | image, prompt, duration, size | Missing: size | **NEEDS FIX** |
| `sora-2/image-to-video-pro-developer` | image, prompt, duration, size | Missing: size | **NEEDS FIX** |

### Required Params for Sora Developer:
```typescript
{
  model: "openai/sora-2/image-to-video-developer",
  image: string,
  prompt: string,
  duration: 10,
  size: "720*1280"
}
```

---

## Hailuo Family (MiniMax)

| Model | Doc Params | Current Impl | Status |
|-------|-----------|--------------|--------|
| `hailuo-2.3/i2v-standard` | image, prompt, duration, enable_prompt_expansion | Missing: enable_prompt_expansion | **NEEDS FIX** |
| `hailuo-2.3/i2v-pro` | image, prompt, enable_prompt_expansion | Missing: enable_prompt_expansion | **NEEDS FIX** |
| `hailuo-2.3/fast` | image, prompt, duration, enable_prompt_expansion, go_fast | Missing: enable_prompt_expansion, go_fast | **NEEDS FIX** |

### Required Params for Hailuo:
```typescript
{
  model: "minimax/hailuo-2.3/i2v-standard",
  image: string,
  prompt: string,
  duration: 6,
  enable_prompt_expansion: false
}
```

---

## Luma Family

| Model | Doc Params | Current Impl | Status |
|-------|-----------|--------------|--------|
| `ray-2-i2v` | image, prompt, size, duration | Uses `duration: number` instead of `duration: "5"` (string) | **NEEDS FIX** |

### Required Params for Luma:
```typescript
{
  model: "luma/ray-2-i2v",
  image: string,
  prompt: string,
  size: "1280*720",
  duration: "5"  // STRING not number!
}
```

---

## Vidu Family (Douyin)

| Model | Doc Params | Current Impl | Status |
|-------|-----------|--------------|--------|
| `reference-to-video-q1` | images[], prompt, aspect_ratio, seed, movement_amplitude | Uses `image` instead of `images[]`, missing movement_amplitude | **NEEDS FIX** |
| `reference-to-video-2.0` | images[], prompt, aspect_ratio, seed, movement_amplitude | Uses `image` instead of `images[]`, missing movement_amplitude | **NEEDS FIX** |
| `start-end-to-video-2.0` | images[], prompt, duration, aspect_ratio, seed, movement_amplitude | Uses `image` instead of `images[]` | **NEEDS FIX** |

### Required Params for Vidu:
```typescript
{
  model: "vidu/reference-to-video-2.0",
  images: [],  // Array of image URLs
  prompt: string,
  aspect_ratio: "16:9",
  seed: 0,
  movement_amplitude: "auto"
}
```

---

## WAN Family (Alibaba)

| Model | Doc Params | Current Impl | Status |
|-------|-----------|--------------|--------|
| `wan-2.6/image-to-video` | audio, duration, enable_prompt_expansion, image, negative_prompt, prompt, resolution, seed, shot_type, generate_audio | Missing: enable_prompt_expansion, negative_prompt, resolution, shot_type, generate_audio | **NEEDS FIX** |
| `wan-2.5/image-to-video` | duration, enable_prompt_expansion, image, negative_prompt, prompt, resolution, seed | Missing: enable_prompt_expansion, negative_prompt, resolution | **NEEDS FIX** |

---

## Other Models

| Model | Doc Params | Status |
|-------|-----------|--------|
| `ltx-2-fast` | duration, generate_audio, image, prompt | Missing: generate_audio |
| `ltx-2-pro` | duration, generate_audio, image, prompt | Missing: generate_audio |
| `magi-1-24b` | image, prompt, num_frames, resolution, aspect_ratio, frames_per_second, enable_safety_checker, seed | Has unique params (num_frames, frames_per_second) |
| `pika/v2.0-turbo-i2v` | image, prompt, size, duration (string) | Uses number instead of string for duration |
| `pixverse/v4.5-i2v-fast` | image, prompt, seed, style, resolution, negative_prompt | Missing: style, negative_prompt |

---

## Video Effects (Special)

These models only need `image` parameter:
- `video-effects/zoom-out`
- `video-effects/shake-dance`
- `video-effects/love-drop`
- `video-effects/jiggle-up`
- `video-effects/fishermen`
- `video-effects/flying`
- `video-effects/gender-swap`
- `video-effects/hulk`

Current implementation sends unnecessary `prompt` and `duration` for these.

---

## Recommended Fix: Video Model Families

Similar to the image generation fix, we should split video models into families:

```typescript
type VideoModelFamily =
  | 'seedance'      // aspect_ratio, camera_fixed, generate_audio, resolution
  | 'kling-standard' // cfg_scale, negative_prompt, sound
  | 'kling-o1'       // aspect_ratio, last_image
  | 'kling-multi'    // images[], aspect_ratio
  | 'kling-effects'  // effect_scene only
  | 'veo'           // aspect_ratio, generate_audio, negative_prompt, resolution
  | 'veo-ref'       // images[], generate_audio, negative_prompt, resolution
  | 'sora'          // Basic: image, prompt, duration
  | 'sora-dev'      // Basic + size
  | 'hailuo'        // enable_prompt_expansion
  | 'luma'          // size, duration (string)
  | 'vidu'          // images[], movement_amplitude
  | 'wan'           // enable_prompt_expansion, negative_prompt, resolution
  | 'video-effects' // image only
  | 'magi'          // num_frames, frames_per_second
```

Then implement `buildVideoRequestBody()` similar to image generation.

---

## Priority Fixes

1. **Seedance** - Most commonly used, missing critical params
2. **Kling** - Popular model, needs cfg_scale and sound
3. **Veo** - Google model, needs resolution and aspect_ratio
4. **Hailuo** - Needs enable_prompt_expansion
5. **Vidu/Kling-multi** - Need `images[]` instead of `image`

---

*Generated: 2026-01-13*
*Reference: IMAGE_TO_VIDEO.md, AtlasCloud.ts*
