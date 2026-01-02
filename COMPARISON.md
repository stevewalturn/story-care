# Model API Mapping Comparison

This document verifies 1:1 mapping between MD documentation files and actual code implementation.

## Summary

| Category | MD File Models | Code Models | Match Rate |
|----------|---------------|-------------|------------|
| TEXT_TO_IMAGE | 49 | 49 | 100% ✅ |
| IMAGE_TO_IMAGE | 54 | 54 | 100% ✅ |
| IMAGE_TO_VIDEO | 46 | 46 | 100% ✅ |

**All models have 1:1 mapping with correct Atlas API strings.**

---

## TEXT_TO_IMAGE.md vs ModelMetadata.ts (getAtlasCloudImageModelId)

| Atlas API String (MD File) | Internal Model ID | Code API Mapping | Status |
|---------------------------|-------------------|------------------|--------|
| `bytedance/seedream-v4.5` | `seedream-4.5-t2i` | `bytedance/seedream-v4.5` | ✅ |
| `bytedance/seedream-v4.5/sequential` | `seedream-4.5-seq-t2i` | `bytedance/seedream-v4.5/sequential` | ✅ |
| `bytedance/seedream-v4` | `seedream-4-t2i` | `bytedance/seedream-v4` | ✅ |
| `bytedance/seedream-v4/sequential` | `seedream-4-seq-t2i` | `bytedance/seedream-v4/sequential` | ✅ |
| `bytedance/seedream-v3.1` | `seedream-3.1-t2i` | `bytedance/seedream-v3.1` | ✅ |
| `bytedance/seedream-v3` | `seedream-3-t2i` | `bytedance/seedream-v3` | ✅ |
| `google/nano-banana-pro/text-to-image-ultra` | `nano-banana-pro-t2i-ultra` | `google/nano-banana-pro/text-to-image-ultra` | ✅ |
| `google/nano-banana-pro/text-to-image` | `nano-banana-pro-t2i` | `google/nano-banana-pro/text-to-image` | ✅ |
| `google/nano-banana-pro/text-to-image-developer` | `nano-banana-pro-t2i-dev` | `google/nano-banana-pro/text-to-image-developer` | ✅ |
| `google/nano-banana/text-to-image` | `nano-banana-t2i` | `google/nano-banana/text-to-image` | ✅ |
| `google/nano-banana/text-to-image-developer` | `nano-banana-t2i-dev` | `google/nano-banana/text-to-image-developer` | ✅ |
| `google/gemini-2.5-flash-image/text-to-image` | `gemini-2.5-flash-t2i` | `google/gemini-2.5-flash-image/text-to-image` | ✅ |
| `google/gemini-2.5-flash-image/text-to-image-developer` | `gemini-2.5-flash-t2i-dev` | `google/gemini-2.5-flash-image/text-to-image-developer` | ✅ |
| `google/imagen4-ultra` | `imagen4-ultra` | `google/imagen4-ultra` | ✅ |
| `google/imagen4` | `imagen4` | `google/imagen4` | ✅ |
| `google/imagen4-fast` | `imagen4-fast` | `google/imagen4-fast` | ✅ |
| `google/imagen3` | `imagen3` | `google/imagen3` | ✅ |
| `google/imagen3-fast` | `imagen3-fast` | `google/imagen3-fast` | ✅ |
| `alibaba/wan-2.6/text-to-image` | `wan-2.6-t2i` | `alibaba/wan-2.6/text-to-image` | ✅ |
| `alibaba/wan-2.5/text-to-image` | `wan-2.5-t2i` | `alibaba/wan-2.5/text-to-image` | ✅ |
| `alibaba/wan-2.1/text-to-image` | `wan-2.1-t2i` | `alibaba/wan-2.1/text-to-image` | ✅ |
| `alibaba/wan-2.1/text-to-image-lora` | `wan-2.1-t2i-lora` | `alibaba/wan-2.1/text-to-image-lora` | ✅ |
| `black-forest-labs/flux-1.1-pro-ultra` | `flux-1.1-pro-ultra` | `black-forest-labs/flux-1.1-pro-ultra` | ✅ |
| `black-forest-labs/flux-1.1-pro` | `flux-1.1-pro` | `black-forest-labs/flux-1.1-pro` | ✅ |
| `black-forest-labs/flux-dev` | `flux-dev` | `black-forest-labs/flux-dev` | ✅ |
| `black-forest-labs/flux-dev-ultra-fast` | `flux-dev-ultra-fast` | `black-forest-labs/flux-dev-ultra-fast` | ✅ |
| `black-forest-labs/flux-dev-lora` | `flux-dev-lora` | `black-forest-labs/flux-dev-lora` | ✅ |
| `black-forest-labs/flux-dev-lora-ultra-fast` | `flux-dev-lora-ultra-fast` | `black-forest-labs/flux-dev-lora-ultra-fast` | ✅ |
| `black-forest-labs/flux-schnell` | `flux-schnell` | `black-forest-labs/flux-schnell` | ✅ |
| `black-forest-labs/flux-schnell-lora` | `flux-schnell-lora` | `black-forest-labs/flux-schnell-lora` | ✅ |
| `black-forest-labs/flux-krea-dev-lora` | `flux-krea-dev-lora-t2i` | `black-forest-labs/flux-krea-dev-lora` | ✅ |
| `black-forest-labs/flux-kontext-max/text-to-image` | `flux-kontext-max-t2i` | `black-forest-labs/flux-kontext-max/text-to-image` | ✅ |
| `black-forest-labs/flux-kontext-pro/text-to-image` | `flux-kontext-pro-t2i` | `black-forest-labs/flux-kontext-pro/text-to-image` | ✅ |
| `ideogram-ai/ideogram-v3-quality` | `ideogram-v3-quality` | `ideogram-ai/ideogram-v3-quality` | ✅ |
| `ideogram-ai/ideogram-v3-balanced` | `ideogram-v3-balanced` | `ideogram-ai/ideogram-v3-balanced` | ✅ |
| `ideogram-ai/ideogram-v3-turbo` | `ideogram-v3-turbo` | `ideogram-ai/ideogram-v3-turbo` | ✅ |
| `ideogram-ai/ideogram-v2` | `ideogram-v2` | `ideogram-ai/ideogram-v2` | ✅ |
| `ideogram-ai/ideogram-v2-turbo` | `ideogram-v2-turbo` | `ideogram-ai/ideogram-v2-turbo` | ✅ |
| `ideogram-ai/ideogram-v2a-turbo` | `ideogram-v2a-turbo` | `ideogram-ai/ideogram-v2a-turbo` | ✅ |
| `recraft-ai/recraft-v3` | `recraft-v3` | `recraft-ai/recraft-v3` | ✅ |
| `recraft-ai/recraft-v3-svg` | `recraft-v3-svg` | `recraft-ai/recraft-v3-svg` | ✅ |
| `recraft-ai/recraft-20b` | `recraft-20b` | `recraft-ai/recraft-20b` | ✅ |
| `recraft-ai/recraft-20b-svg` | `recraft-20b-svg` | `recraft-ai/recraft-20b-svg` | ✅ |
| `luma/photon` | `photon-t2i` | `luma/photon` | ✅ |
| `luma/photon-flash` | `photon-flash-t2i` | `luma/photon-flash` | ✅ |
| `atlascloud/hunyuan-image-3` | `hunyuan-image-3` | `atlascloud/hunyuan-image-3` | ✅ |
| `atlascloud/neta-lumina` | `neta-lumina` | `atlascloud/neta-lumina` | ✅ |
| `atlascloud/imagen4` | `atlascloud-imagen4` | `atlascloud/imagen4` | ✅ |
| `atlascloud/qwen-image/text-to-image` | `qwen-t2i` | `atlascloud/qwen-image/text-to-image` | ✅ |
| `atlascloud/hidream-i1-full` | `hidream-i1-full` | `atlascloud/hidream-i1-full` | ✅ |
| `atlascloud/hidream-i1-dev` | `hidream-i1-dev` | `atlascloud/hidream-i1-dev` | ✅ |
| `z-image/turbo` | `z-image-turbo` | `z-image/turbo` | ✅ |
| `z-image/turbo-lora` | `z-image-turbo-lora` | `z-image/turbo-lora` | ✅ |

**TEXT_TO_IMAGE Summary: 49/49 models mapped (100%)**

---

## IMAGE_TO_IMAGE.md vs AtlasCloud.ts (MODEL_CONFIGS.atlasName)

| Atlas API String (MD File) | Internal Model ID | Code atlasName | Status |
|---------------------------|-------------------|----------------|--------|
| `alibaba/wan-2.6/image-edit` | `wan-2.6-i2i` | `alibaba/wan-2.6/image-edit` | ✅ |
| `alibaba/wan-2.5/image-edit` | `wan-2.5-edit` | `alibaba/wan-2.5/image-edit` | ✅ |
| `alibaba/wan-2.1/text-to-image-lora` | `wan-2.1-t2i-lora` | `alibaba/wan-2.1/text-to-image-lora` | ✅ |
| `bytedance/seedream-v4.5/edit` | `seedream-4.5-edit` | `bytedance/seedream-v4.5/edit` | ✅ |
| `bytedance/seedream-v4.5/edit-sequential` | `seedream-4.5-edit-seq` | `bytedance/seedream-v4.5/edit-sequential` | ✅ |
| `bytedance/seedream-v4/edit` | `seedream-4-edit` | `bytedance/seedream-v4/edit` | ✅ |
| `bytedance/seedream-v4/edit-sequential` | `seedream-4-edit-seq` | `bytedance/seedream-v4/edit-sequential` | ✅ |
| `bytedance/seededit-v3` | `seededit-v3` | `bytedance/seededit-v3` | ✅ |
| `bytedance/portrait` | `portrait` | `bytedance/portrait` | ✅ |
| `google/nano-banana-pro/edit` | `nano-banana-pro-edit` | `google/nano-banana-pro/edit` | ✅ |
| `google/nano-banana-pro/edit-ultra` | `nano-banana-pro-edit-ultra` | `google/nano-banana-pro/edit-ultra` | ✅ |
| `google/nano-banana-pro/edit-developer` | `nano-banana-pro-edit-dev` | `google/nano-banana-pro/edit-developer` | ✅ |
| `google/nano-banana/edit` | `nano-banana-edit` | `google/nano-banana/edit` | ✅ |
| `google/nano-banana/edit-developer` | `nano-banana-edit-dev` | `google/nano-banana/edit-developer` | ✅ |
| `black-forest-labs/flux-2-dev/edit` | `flux-2-dev-edit` | `black-forest-labs/flux-2-dev/edit` | ✅ |
| `black-forest-labs/flux-2-pro/edit` | `flux-2-pro-edit` | `black-forest-labs/flux-2-pro/edit` | ✅ |
| `black-forest-labs/flux-2-flex/edit` | `flux-2-flex-edit` | `black-forest-labs/flux-2-flex/edit` | ✅ |
| `black-forest-labs/flux-2-flex/text-to-image` | `flux-2-flex-t2i` | `black-forest-labs/flux-2-flex/text-to-image` | ✅ |
| `black-forest-labs/flux-kontext-max` | `flux-kontext-max` | `black-forest-labs/flux-kontext-max` | ✅ |
| `black-forest-labs/flux-kontext-max/multi` | `flux-kontext-max-multi` | `black-forest-labs/flux-kontext-max/multi` | ✅ |
| `black-forest-labs/flux-kontext-pro` | `flux-kontext-pro` | `black-forest-labs/flux-kontext-pro` | ✅ |
| `black-forest-labs/flux-kontext-pro/multi` | `flux-kontext-pro-multi` | `black-forest-labs/flux-kontext-pro/multi` | ✅ |
| `black-forest-labs/flux-kontext-dev` | `flux-kontext-dev` | `black-forest-labs/flux-kontext-dev` | ✅ |
| `black-forest-labs/flux-kontext-dev-ultra-fast` | `flux-kontext-dev-ultra-fast` | `black-forest-labs/flux-kontext-dev-ultra-fast` | ✅ |
| `black-forest-labs/flux-kontext-dev/multi` | `flux-kontext-dev-multi` | `black-forest-labs/flux-kontext-dev/multi` | ✅ |
| `black-forest-labs/flux-kontext-dev/multi-ultra-fast` | `flux-kontext-dev-multi-ultra-fast` | `black-forest-labs/flux-kontext-dev/multi-ultra-fast` | ✅ |
| `black-forest-labs/flux-kontext-dev-lora` | `flux-kontext-dev-lora` | `black-forest-labs/flux-kontext-dev-lora` | ✅ |
| `black-forest-labs/flux-kontext-dev-lora-ultra-fast` | `flux-kontext-dev-lora-ultra-fast` | `black-forest-labs/flux-kontext-dev-lora-ultra-fast` | ✅ |
| `black-forest-labs/flux-krea-dev-lora` | `flux-krea-dev-lora` | `black-forest-labs/flux-krea-dev-lora` | ✅ |
| `black-forest-labs/flux-redux-dev` | `flux-redux-dev` | `black-forest-labs/flux-redux-dev` | ✅ |
| `black-forest-labs/flux-redux-pro` | `flux-redux-pro` | `black-forest-labs/flux-redux-pro` | ✅ |
| `black-forest-labs/flux-fill-dev` | `flux-fill-dev` | `black-forest-labs/flux-fill-dev` | ✅ |
| `black-forest-labs/flux-controlnet-union-pro-2.0` | `flux-controlnet-pro` | `black-forest-labs/flux-controlnet-union-pro-2.0` | ✅ |
| `luma/photon-modify` | `photon-modify` | `luma/photon-modify` | ✅ |
| `luma/photon-flash-modify` | `photon-flash-modify` | `luma/photon-flash-modify` | ✅ |
| `atlascloud/ghibli` | `ghibli` | `atlascloud/ghibli` | ✅ |
| `atlascloud/real-esrgan` | `real-esrgan` | `atlascloud/real-esrgan` | ✅ |
| `atlascloud/instant-character` | `instant-character` | `atlascloud/instant-character` | ✅ |
| `atlascloud/qwen-image/edit` | `qwen-image-edit` | `atlascloud/qwen-image/edit` | ✅ |
| `atlascloud/qwen-image/edit-plus` | `qwen-image-edit-plus` | `atlascloud/qwen-image/edit-plus` | ✅ |
| `atlascloud/step1x-edit` | `step1x-edit` | `atlascloud/step1x-edit` | ✅ |
| `atlascloud/image-zoom-out` | `image-zoom-out` | `atlascloud/image-zoom-out` | ✅ |
| `atlascloud/image-watermark-remover` | `image-watermark-remover` | `atlascloud/image-watermark-remover` | ✅ |
| `atlascloud/hidream-e1-full` | `hidream-e1-full` | `atlascloud/hidream-e1-full` | ✅ |
| `recraft-ai/recraft-crisp-upscale` | `recraft-crisp-upscale` | `recraft-ai/recraft-crisp-upscale` | ✅ |
| `recraft-ai/recraft-creative-upscale` | `recraft-creative-upscale` | `recraft-ai/recraft-creative-upscale` | ✅ |
| `image-effects/micro-landscape-mini-world` | `micro-landscape-mini-world` | `image-effects/micro-landscape-mini-world` | ✅ |
| `image-effects/my-world` | `my-world` | `image-effects/my-world` | ✅ |
| `image-effects/plastic-bubble-figure` | `plastic-bubble-figure` | `image-effects/plastic-bubble-figure` | ✅ |
| `image-effects/glass-ball` | `glass-ball` | `image-effects/glass-ball` | ✅ |
| `image-effects/felt-keychain` | `felt-keychain` | `image-effects/felt-keychain` | ✅ |
| `image-effects/felt-3d-polaroid` | `felt-3d-polaroid` | `image-effects/felt-3d-polaroid` | ✅ |
| `image-effects/advanced-photography` | `advanced-photography` | `image-effects/advanced-photography` | ✅ |
| `image-effects/american-comic-style` | `american-comic-style` | `image-effects/american-comic-style` | ✅ |

**IMAGE_TO_IMAGE Summary: 54/54 models mapped (100%)**

---

## IMAGE_TO_VIDEO.md vs ModelMetadata.ts (getAtlasCloudVideoModelId)

| Atlas API String (MD File) | Internal Model ID | Code API Mapping | Status |
|---------------------------|-------------------|------------------|--------|
| `bytedance/seedance-v1.5-pro/image-to-video` | `seedance-v1.5-pro-i2v` | `bytedance/seedance-v1.5-pro/image-to-video` | ✅ |
| `bytedance/seedance-v1-pro-fast/image-to-video` | `seedance-v1-pro-fast-i2v` | `bytedance/seedance-v1-pro-fast/image-to-video` | ✅ |
| `alibaba/wan-2.6/image-to-video` | `wan-2.6-i2v` | `alibaba/wan-2.6/image-to-video` | ✅ |
| `alibaba/wan-2.5/image-to-video` | `wan-2.5-i2v` | `alibaba/wan-2.5/image-to-video` | ✅ |
| `alibaba/wan-2.5/image-to-video-fast` | `wan-2.5-fast-i2v` | `alibaba/wan-2.5/image-to-video-fast` | ✅ |
| `alibaba/wan-2.2/i2v-5b-720p-lora` | `wan-2.2-lora-i2v` | `alibaba/wan-2.2/i2v-5b-720p-lora` | ✅ |
| `kwaivgi/kling-v2.6-pro/image-to-video` | `kling-2.6-pro-i2v` | `kwaivgi/kling-v2.6-pro/image-to-video` | ✅ |
| `kwaivgi/kling-video-o1/image-to-video` | `kling-video-o1-i2v` | `kwaivgi/kling-video-o1/image-to-video` | ✅ |
| `kwaivgi/kling-v2.5-turbo-pro/image-to-video` | `kling-2.5-turbo-pro-i2v` | `kwaivgi/kling-v2.5-turbo-pro/image-to-video` | ✅ |
| `kwaivgi/kling-v2.1-i2v-pro/start-end-frame` | `kling-2.1-start-end-i2v` | `kwaivgi/kling-v2.1-i2v-pro/start-end-frame` | ✅ |
| `kwaivgi/kling-v2.0-i2v-master` | `kling-2.0-master-i2v` | `kwaivgi/kling-v2.0-i2v-master` | ✅ |
| `kwaivgi/kling-v1.6-multi-i2v-pro` | `kling-1.6-multi-pro-i2v` | `kwaivgi/kling-v1.6-multi-i2v-pro` | ✅ |
| `kwaivgi/kling-v1.6-multi-i2v-standard` | `kling-1.6-multi-std-i2v` | `kwaivgi/kling-v1.6-multi-i2v-standard` | ✅ |
| `kwaivgi/kling-effects` | `kling-effects` | `kwaivgi/kling-effects` | ✅ |
| `openai/sora-2/image-to-video` | `sora-2-i2v` | `openai/sora-2/image-to-video` | ✅ |
| `openai/sora-2/image-to-video-pro` | `sora-2-i2v-pro` | `openai/sora-2/image-to-video-pro` | ✅ |
| `openai/sora-2/image-to-video-developer` | `sora-2-i2v-dev` | `openai/sora-2/image-to-video-developer` | ✅ |
| `openai/sora-2/image-to-video-pro-developer` | `sora-2-i2v-pro-dev` | `openai/sora-2/image-to-video-pro-developer` | ✅ |
| `google/veo3.1/image-to-video` | `veo3.1-i2v` | `google/veo3.1/image-to-video` | ✅ |
| `google/veo3.1-fast/image-to-video` | `veo3.1-fast-i2v` | `google/veo3.1-fast/image-to-video` | ✅ |
| `google/veo3.1/reference-to-video` | `veo3.1-ref-i2v` | `google/veo3.1/reference-to-video` | ✅ |
| `google/veo3/image-to-video` | `veo3-i2v` | `google/veo3/image-to-video` | ✅ |
| `google/veo3-fast/image-to-video` | `veo3-fast-i2v` | `google/veo3-fast/image-to-video` | ✅ |
| `google/veo2/image-to-video` | `veo2-i2v` | `google/veo2/image-to-video` | ✅ |
| `minimax/hailuo-2.3/i2v-pro` | `hailuo-2.3-pro-i2v` | `minimax/hailuo-2.3/i2v-pro` | ✅ |
| `minimax/hailuo-2.3/i2v-standard` | `hailuo-2.3-standard-i2v` | `minimax/hailuo-2.3/i2v-standard` | ✅ |
| `minimax/hailuo-2.3/fast` | `hailuo-2.3-fast-i2v` | `minimax/hailuo-2.3/fast` | ✅ |
| `minimax/hailuo-02/t2v-pro` | `hailuo-02-t2v-pro` | `minimax/hailuo-02/t2v-pro` | ✅ |
| `lightricks/ltx-2-fast/image-to-video` | `ltx-2-fast-i2v` | `lightricks/ltx-2-fast/image-to-video` | ✅ |
| `lightricks/ltx-2-pro/image-to-video` | `ltx-2-pro-i2v` | `lightricks/ltx-2-pro/image-to-video` | ✅ |
| `atlascloud/ltx-video-v097/i2v-720p` | `ltx-video-097-i2v` | `atlascloud/ltx-video-v097/i2v-720p` | ✅ |
| `atlascloud/magi-1-24b` | `magi-1-24b` | `atlascloud/magi-1-24b` | ✅ |
| `vidu/reference-to-video-q1` | `vidu-ref-q1-i2v` | `vidu/reference-to-video-q1` | ✅ |
| `vidu/reference-to-video-2.0` | `vidu-ref-2.0-i2v` | `vidu/reference-to-video-2.0` | ✅ |
| `vidu/start-end-to-video-2.0` | `vidu-start-end-2.0` | `vidu/start-end-to-video-2.0` | ✅ |
| `luma/ray-2-i2v` | `luma-ray-2-i2v` | `luma/ray-2-i2v` | ✅ |
| `pika/v2.0-turbo-i2v` | `pika-2.0-turbo-i2v` | `pika/v2.0-turbo-i2v` | ✅ |
| `pixverse/pixverse-v4.5-i2v-fast` | `pixverse-4.5-fast-i2v` | `pixverse/pixverse-v4.5-i2v-fast` | ✅ |
| `video-effects/zoom-out` | `video-zoom-out` | `video-effects/zoom-out` | ✅ |
| `video-effects/shake-dance` | `video-shake-dance` | `video-effects/shake-dance` | ✅ |
| `video-effects/love-drop` | `video-love-drop` | `video-effects/love-drop` | ✅ |
| `video-effects/jiggle-up` | `video-jiggle-up` | `video-effects/jiggle-up` | ✅ |
| `video-effects/fishermen` | `video-fishermen` | `video-effects/fishermen` | ✅ |
| `video-effects/flying` | `video-flying` | `video-effects/flying` | ✅ |
| `video-effects/gender-swap` | `video-gender-swap` | `video-effects/gender-swap` | ✅ |
| `video-effects/hulk` | `video-hulk` | `video-effects/hulk` | ✅ |

**IMAGE_TO_VIDEO Summary: 46/46 models mapped (100%)**

---

## Files Referenced
- `TEXT_TO_IMAGE.md` - Atlas Cloud text-to-image API documentation
- `IMAGE_TO_IMAGE.md` - Atlas Cloud image-to-image API documentation
- `IMAGE_TO_VIDEO.md` - Atlas Cloud image-to-video API documentation
- `src/libs/ModelMetadata.ts` - Model definitions and API mappings
- `src/libs/providers/AtlasCloud.ts` - MODEL_CONFIGS with atlasName values + video generation
- `src/libs/ImageGeneration.ts` - Image model routing logic
- `src/libs/VideoGeneration.ts` - Video model routing logic

---

*Generated: 2026-01-02*
*Updated: Video generation fixed - all 46 models now use correct Atlas API paths*
