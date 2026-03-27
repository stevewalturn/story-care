# AI Models Reference — StoryCare

A complete map of every AI/LLM service used in StoryCare: what it does, which models are available, and exactly where/how each call happens.

---

## 1. Deepgram — Speech-to-Text

**Purpose:** Transcribe therapy session audio with speaker diarization (identifying who said what).

**Provider file:** `src/libs/Deepgram.ts`
**API:** Deepgram REST API (`api.deepgram.com`)
**Auth:** `DEEPGRAM_API_KEY` env var

### Models Used

| Model | Notes |
|-------|-------|
| `nova-2` | Default — best accuracy/speed balance |

### Features enabled by default
- `diarize: true` — speaker identification
- `smart_format: true` — auto-punctuation, paragraphs
- `punctuate: true`
- `utterances: true` — timestamped segments

### Where it's called

| Trigger | API Route | Function |
|---------|-----------|----------|
| Therapist clicks "Transcribe" on session | `POST /api/sessions/[id]/transcribe` | `transcribeAudio(audioPresignedUrl)` |
| Audio buffer upload | Internal | `transcribeAudioBuffer(buffer)` |

---

## 2. Google Gemini (via Vertex AI) — Text Generation / AI Chat

**Purpose:** Primary AI text model for therapist AI assistant, session summarization, quote extraction, music suggestions, and chat context summarization.

**Provider file:** `src/libs/providers/GeminiChat.ts`
**Abstraction layer:** `src/libs/TextGeneration.ts` → `generateText()`
**API:** Vertex AI REST (`{region}-aiplatform.googleapis.com` or `aiplatform.googleapis.com` for Priority PayGo)
**Auth:** `GOOGLE_SERVICE_ACCOUNT_KEY` (JSON service account) → OAuth 2.0 Bearer token (cached 55 min)

### Models Available

| Model | Context | Speed | Cost | Notes |
|-------|---------|-------|------|-------|
| `gemini-2.5-pro` | 1M tokens | Slow | High | Highest quality |
| `gemini-2.5-flash` | 1M tokens | Fast | Medium | **Default for chat** |
| `gemini-2.5-flash-lite` | 1M tokens | Fastest | Lowest | **Used for background jobs** |
| `gemini-2.0-flash` | 1M tokens | Fast | Medium | Next-gen |
| `gemini-2.0-flash-lite` | 1M tokens | Fastest | Lowest | Fallback |
| `gemini-1.5-pro` | 2M tokens | Slow | High | Legacy |
| `gemini-1.5-flash` | 1M tokens | Fast | Low | Legacy |

### Automatic Fallback Chain (on quota exhaustion / 429)
```
gemini-2.5-pro  →  gemini-2.5-flash
gemini-2.5-flash  →  gemini-2.5-flash-lite
gemini-2.0-flash  →  gemini-2.0-flash-lite
```
Implemented in `src/libs/TextGeneration.ts`.

### Priority PayGo Mode
Controlled by `VERTEX_AI_PRIORITY_PAYGO=true` (default: `false`).
- Switches to global endpoint: `https://aiplatform.googleapis.com/v1/.../locations/global/...`
- Adds headers: `X-Vertex-AI-LLM-Request-Type: shared` + `X-Vertex-AI-LLM-Shared-Request-Type: priority`

### Retry behavior
2 automatic retries on 429, with 1s then 2s backoff, before throwing.

### Where it's called

| Trigger | API Route / Service | Function | Default Model |
|---------|---------------------|----------|---------------|
| Therapist sends message to AI assistant | `POST /api/ai/chat` | `generateText()` | `gemini-2.5-flash` |
| AI chat context window fills up | `ChatSummaryService.generateChatSummary()` | `generateText()` | `gpt-4o-mini` *(see note)* |
| Background session analysis | `SessionSummaryService.generateSessionSummary()` | `generateText()` | `gemini-2.5-flash-lite` |
| Extract key quotes from transcript | `POST /api/ai/extract-quotes` | `generateText()` | `gemini-2.5-flash` |
| Suggest music options for a scene | `POST /api/ai/suggest-music-options` | `generateText()` | `gpt-4o-mini` *(see note)* |

> **Note:** Routes that use `generateText()` with an OpenAI model name (`gpt-4o-mini` etc.) route to OpenAI, not Gemini. The abstraction layer in `TextGeneration.ts` dispatches based on model name prefix.

---

## 3. OpenAI GPT — Text Generation

**Purpose:** Structured JSON generation, scene planning, prompt optimization, music suggestions, and chat summaries — tasks where consistent structured output is important.

**Provider file:** `src/libs/providers/OpenAIChat.ts`
**Direct client:** `src/libs/OpenAI.ts` (used in some routes directly)
**Abstraction layer:** `src/libs/TextGeneration.ts` → `generateText()`
**API:** OpenAI API (`api.openai.com`)
**Auth:** `OPENAI_API_KEY` env var

### Models Available

| Model | Notes |
|-------|-------|
| `gpt-4.1` | Latest GPT-4.1 |
| `gpt-4.1-mini` | Smaller, faster GPT-4.1 |
| `gpt-4.1-nano` | Smallest GPT-4.1 |
| `gpt-4o` | Multimodal, high quality |
| `gpt-4o-mini` | **Most-used default** — cost-efficient |
| `gpt-4-turbo` | Legacy |
| `gpt-3.5-turbo` | Fastest, cheapest |
| `o3-mini` / `o3` / `o3-pro` | Advanced reasoning |
| `o1-pro` / `o1` / `o1-mini` | Reasoning |

### Where it's called

| Trigger | API Route / Service | Model | Notes |
|---------|---------------------|-------|-------|
| Generate scene descriptions for a patient story | `POST /api/ai/generate-scenes` | `gpt-4o-mini` (default, configurable) | Returns structured JSON; falls back to markdown fence extraction on parse error |
| Optimize image/video prompt text | `POST /api/ai/optimize-prompt` | `gpt-4o-mini` (default, configurable) | Plain text output |
| Generate building block JSON for page templates | `POST /api/ai/generate-prompt-json` | `gpt-4o-mini` | Structured JSON output |
| Suggest music style/mood options | `POST /api/ai/suggest-music-options` | `gpt-4o-mini` | Returns list of music prompts |
| Summarize AI chat context window | `ChatSummaryService.generateChatSummary()` | `gpt-4o-mini` | Triggered when message count exceeds threshold |

Allowed model values for API routes that accept a `model` field: `gpt-4o`, `gpt-4o-mini`, `gpt-4.1`, `gpt-4.1-mini`

---

## 4. Google Vertex AI Imagen — Image Generation

**Purpose:** Generate therapeutic images (text-to-image and image-to-image) via the Imagen family of models.

**Provider file:** `src/libs/providers/GeminiImage.ts`
**Abstraction layer:** `src/libs/ImageGeneration.ts` → `generateImage()`
**API:** Vertex AI REST (same endpoint infrastructure as Gemini text — also supports Priority PayGo)
**Auth:** `GOOGLE_SERVICE_ACCOUNT_KEY` → OAuth Bearer token

### Models Available via Direct Vertex AI

| Model | Notes |
|-------|-------|
| `gemini-2.5-flash-image` | Image-to-Image only (single reference image) |

### Models Available via Atlas Cloud (Imagen family)

| Model | Type |
|-------|------|
| `imagen4-ultra` | Text-to-Image, highest quality |
| `imagen4` | Text-to-Image |
| `imagen4-fast` | Text-to-Image, faster |
| `atlascloud-imagen4` | Text-to-Image via Atlas routing |
| `imagen3` | Text-to-Image |
| `imagen3-fast` | Text-to-Image, faster |

### Where it's called

| Trigger | API Route | Notes |
|---------|-----------|-------|
| Therapist generates an image for a patient asset | `POST /api/ai/generate-image` | Model chosen by therapist in UI; supports reference images for i2i |

---

## 5. Atlas Cloud — Multi-Model Image Gateway

**Purpose:** Gateway provider that exposes 60+ image generation models (Flux, Seedream, Ideogram, Recraft, Wan, Luma, etc.) under a single API, including image-to-image, editing, upscaling, and style-transfer workflows.

**Provider file:** `src/libs/providers/AtlasCloud.ts`
**Abstraction layer:** `src/libs/ImageGeneration.ts` → `generateImage()`
**Auth:** `ATLASCLOUD_API_KEY` env var

### Model Family Groups

| Family | Examples |
|--------|---------|
| Flux (text-to-image) | `flux-schnell`, `flux-dev`, `flux-1.1-pro-ultra`, `flux-kontext-max-t2i` |
| Flux (image editing) | `flux-kontext-max`, `flux-kontext-pro`, `flux-2-dev-edit`, `flux-fill-dev` |
| Seedream | `seedream-4.5-t2i`, `seedream-4.5-edit`, `seededit-v3` |
| Ideogram | `ideogram-v3-quality`, `ideogram-v3-balanced`, `ideogram-v2` |
| Recraft | `recraft-v3`, `recraft-v3-svg`, `recraft-20b` |
| Wan/Alibaba | `wan-2.6-t2i`, `wan-2.6-i2i`, `qwen-image-edit` |
| Luma Photon | `photon-t2i`, `photon-modify` |
| Gemini/Nano Banana | `gemini-2.5-flash-t2i`, `nano-banana-pro-t2i` |
| Imagen (via Atlas) | `imagen4-ultra`, `imagen3` |
| Upscaling | `recraft-crisp-upscale`, `real-esrgan` |
| Utilities | `image-zoom-out`, `image-watermark-remover` |
| Style Transfer | `ghibli`, `american-comic-style`, `glass-ball` |

### Where it's called

| Trigger | API Route | Notes |
|---------|-----------|-------|
| Therapist generates an image | `POST /api/ai/generate-image` | Automatically routed when model is in Atlas catalogue |

---

## 6. Stability AI — Image Generation

**Purpose:** Generate images via Stability AI's Stable Diffusion models.

**Provider file:** `src/libs/providers/StabilityAI.ts`
**Abstraction layer:** `src/libs/ImageGeneration.ts` → `generateImage()`

### Models Available

| Model | Notes |
|-------|-------|
| `sd3.5-large` | Stable Diffusion 3.5 Large |
| `sd3.5-medium` | Stable Diffusion 3.5 Medium |
| `sd3-large` | Stable Diffusion 3 Large |
| `sdxl-1.0` | SDXL |

### Where it's called

| Trigger | API Route | Notes |
|---------|-----------|-------|
| Therapist generates an image | `POST /api/ai/generate-image` | Routed when model is an SD variant |

---

## 7. FAL.AI — Image Generation

**Purpose:** Generate images via FAL's hosted Flux and SDXL models.

**Provider file:** `src/libs/providers/FalAI.ts`
**Abstraction layer:** `src/libs/ImageGeneration.ts` → `generateImage()`

### Models Available

| Model | Notes |
|-------|-------|
| `flux-pro` | Flux Pro |
| `flux-realism` | Flux Realism |
| `sdxl` | SDXL via FAL |
| `sdxl-lightning` | SDXL Lightning (4-step) |

### Where it's called

| Trigger | API Route | Notes |
|---------|-----------|-------|
| Therapist generates an image | `POST /api/ai/generate-image` | Routed when model is a Fal variant |

---

## 8. Suno AI — Music Generation

**Purpose:** Generate therapeutic music tracks from text prompts (mood, style, lyrics).

**API:** `api.sunoapi.org/api/v1/generate`
**Auth:** `SUNO_API_KEY` env var
**Delivery:** Async — Suno processes in background and calls back via webhook

### Models Available

| Model | Notes |
|-------|-------|
| `V4_5` | Default — best quality |
| `V4` | Previous generation |
| `V4_5PLUS` | V4.5 enhanced |
| `V4_5ALL` | V4.5 all styles |
| `V5` | Latest |

### How it works (async flow)

```
1. Therapist submits music prompt
   → POST /api/ai/music-tasks (creates task in DB, calls Suno API)

2. Suno processes asynchronously
   → POST /api/webhooks/suno (receives completion callback)
   → Audio downloaded to GCS, media library entry created

3. Therapist polls for status
   → GET /api/ai/music-task/[taskId]
   → GET /api/ai/music-tasks (list all tasks)
```

### Where it's called

| Trigger | Route | Notes |
|---------|-------|-------|
| Therapist generates music for a scene | `POST /api/ai/music-tasks` | Supports custom prompts, instrumental mode |
| Completion webhook from Suno | `POST /api/webhooks/suno` | Requires `SUNO_WEBHOOK_SECRET` for signature verification |
| Poll task status | `GET /api/ai/music-task/[taskId]` | Falls back to DB if Suno API unavailable |

---

## Summary Table

| AI Service | Provider | Purpose | Trigger |
|-----------|----------|---------|---------|
| Deepgram nova-2 | deepgram.com | Speech-to-text + diarization | Session audio transcription |
| Gemini 2.5 Flash | Google Vertex AI | AI chat assistant | Therapist ↔ AI conversation |
| Gemini 2.5 Flash-Lite | Google Vertex AI | Session summarization, background analysis | Auto-triggered post-session |
| GPT-4o-mini | OpenAI | Scene generation, prompt optimization, chat summaries, music suggestions | Therapist UI actions |
| Imagen 4 / Imagen 3 | Atlas Cloud / Vertex AI | Therapeutic image generation | Therapist clicks "Generate Image" |
| Flux / Seedream / Ideogram etc. | Atlas Cloud | 60+ image models for creative generation | Therapist selects model in UI |
| Gemini 2.5 Flash (image) | Google Vertex AI | Image-to-image editing | Reference image + prompt workflow |
| Stable Diffusion | Stability AI | Image generation | Therapist selects SD model |
| Flux / SDXL | FAL.AI | Image generation | Therapist selects Fal model |
| Suno V4.5 | Suno AI | Music generation | Therapist creates music for scene |

---

## Cost Optimization Notes

- **Background jobs** (session summaries) always use `gemini-2.5-flash-lite` — lowest cost
- **Chat** defaults to `gemini-2.5-flash` with automatic downgrade to `flash-lite` on quota exhaustion
- **OpenAI routes** default to `gpt-4o-mini` — enforced via allowlist enum in API validation
- **Suno** is async — no blocking API cost at request time, billed per generation
- **Vertex AI** supports Priority PayGo tier (set `VERTEX_AI_PRIORITY_PAYGO=true`) for predictable lower latency at higher cost per token

---

*Last updated: 2026-03-26*
