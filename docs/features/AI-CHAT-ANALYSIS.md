# AI Chat & Analysis

## Overview

StoryCare provides an AI chat assistant powered by multiple LLM providers (OpenAI GPT-4, Google Gemini) for analyzing therapy session transcripts. Therapists can chat with the AI about session content, run structured analyses using treatment modules, generate building blocks (images, videos, music) from transcript insights, and receive therapeutic recommendations. The system uses a multi-provider abstraction layer that routes requests based on the selected model.

## User Roles

| Role | Access Level |
|------|-------------|
| Therapist | Full access to AI chat within their sessions; can select models, run analyses, generate content |
| Org Admin | Can access AI chat for sessions within their organization |
| Super Admin | Full platform-wide access |
| Patient | No access to AI chat features |

## User Workflow

### AI Chat Conversation
1. Therapist opens a session and navigates to the AI chat panel.
2. Therapist selects text from the transcript or types a custom prompt.
3. Client sends the message along with session context (transcript, selected utterances) to the text generation API.
4. AI responds with analysis, suggestions, or structured JSON output.
5. Both user and assistant messages are saved to `ai_chat_messages` for history.

### Module-Based Analysis
1. Therapist assigns a treatment module to the session.
2. Therapist triggers analysis via `POST /api/sessions/[id]/analyze-with-module`.
3. System constructs a prompt using the module's analysis template and the session transcript.
4. AI generates a structured analysis result (JSON) following the module's output schema.
5. Results are stored in `session_modules.aiAnalysisResult`.
6. Therapist reviews the analysis and can generate a story page from the results.

### Prompt Management
1. Therapists can create and manage custom AI prompts via `/prompts`.
2. Org Admins can manage organization-level prompts via `/org-admin/prompts`.
3. Super Admins can manage system-wide prompts via `/super-admin/prompts`.
4. Prompts can be ordered and prioritized for each session context.

## UI Pages

| Page | Path | Description |
|------|------|-------------|
| Session AI Chat | `/sessions/[id]` (chat panel) | Interactive AI conversation about session content |
| Prompts Management | `/prompts` | Therapist's custom prompt library |
| Org Admin Prompts | `/org-admin/prompts` | Organization-level prompt management |
| Super Admin Prompts | `/super-admin/prompts` | System-wide prompt management |

## API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/sessions/[id]/chat` | Get chat history for a session | Bearer token (therapist+) |
| POST | `/api/sessions/[id]/chat` | Save a chat message (user or assistant) | Bearer token (therapist+) |
| POST | `/api/sessions/[id]/analyze-with-module` | Run AI analysis with assigned treatment module | Bearer token (therapist+) |
| GET | `/api/sessions/[id]/summary` | Get or generate session summary | Bearer token (therapist+) |
| GET | `/api/sessions/[id]/ai-prompts` | Get available AI prompts for session context | Bearer token (therapist+) |
| POST | `/api/ai/clear-chat` | Clear chat history for a session | Bearer token (therapist+) |
| POST | `/api/ai/optimize-prompt` | Optimize a prompt using AI | Bearer token (therapist+) |
| GET | `/api/prompts` | List therapist's custom prompts | Bearer token (therapist+) |
| POST | `/api/prompts` | Create a custom prompt | Bearer token (therapist+) |
| PUT | `/api/prompts/[id]` | Update a custom prompt | Bearer token (therapist+) |
| DELETE | `/api/prompts/[id]` | Delete a custom prompt | Bearer token (therapist+) |
| POST | `/api/therapist/prompts/order` | Reorder therapist prompts | Bearer token (therapist) |

## Database Tables

| Table | Role in Feature |
|-------|----------------|
| `ai_chat_messages` | Chat history: `id`, `sessionId`, `therapistId`, `role` (user/assistant/system), `content`, `selectedText`, `selectedUtteranceIds`, `generatedMediaId`, `promptType`, `createdAt` |
| `session_modules` | Module analysis results: `aiAnalysisCompleted`, `aiAnalysisResult` (JSONB) |
| `system_prompts` | Reusable AI prompt templates with categories and ordering |
| `treatment_modules` | Module definitions including analysis templates and output schemas |

## Key Files

| File | Purpose |
|------|---------|
| `src/libs/TextGeneration.ts` | Unified text generation interface; routes to OpenAI or Gemini based on model name |
| `src/libs/providers/OpenAIChat.ts` | OpenAI chat implementation (GPT-4.1, GPT-4o, GPT-3.5-turbo, o3, o1 series) |
| `src/libs/providers/GeminiChat.ts` | Google Gemini chat implementation (Gemini 2.5 Pro/Flash, 2.0, 1.5 series) |
| `src/app/api/sessions/[id]/chat/route.ts` | GET chat history, POST save chat message |
| `src/app/api/sessions/[id]/analyze-with-module/route.ts` | Module-based AI analysis |
| `src/app/api/sessions/[id]/summary/route.ts` | Session summary generation |
| `src/app/api/ai/clear-chat/route.ts` | Clear chat history for a session |
| `src/app/api/ai/optimize-prompt/route.ts` | AI-powered prompt optimization |
| `src/services/SessionSummaryService.ts` | Session summary generation logic |
| `src/services/ChatSummaryService.ts` | Chat conversation summarization |
| `src/libs/LangfuseTracing.ts` | Observability tracing for all AI API calls with cost tracking |
| `src/libs/ModelMetadata.ts` | Model metadata (names, providers, capabilities) |
| `src/libs/ModelPricing.ts` | Static pricing data for cost estimation |

## Technical Notes

- **Multi-provider routing**: `generateText()` inspects the model name to route to the correct provider. OpenAI models (gpt-*, o3*, o1*) go to `OpenAIChat`, Gemini models go to `GeminiChat`.
- **Supported text models**: OpenAI (gpt-4.1, gpt-4.1-mini, gpt-4.1-nano, gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo, o3-mini, o3, o3-pro, o1-pro, o1, o1-mini), Gemini (gemini-2.5-pro, gemini-2.5-flash, gemini-2.5-flash-lite, gemini-2.0-flash, gemini-2.0-flash-lite, gemini-1.5-pro, gemini-1.5-flash).
- **Chat message structure**: Messages follow the standard `{ role, content }` format with `system`, `user`, and `assistant` roles. Additional metadata includes `selectedText` (highlighted transcript text), `selectedUtteranceIds`, and `generatedMediaId`.
- **Langfuse tracing**: All text generation calls are traced with Langfuse for observability, including model used, input/output token counts, latency, and cost. Pricing is fetched from the database first, with a static fallback.
- **Prompt management hierarchy**: System prompts (super_admin) -> Organization prompts (org_admin) -> Therapist prompts (therapist). Prompts can be ordered via a `sortOrder` field.
- **Structured output**: Module analysis produces structured JSON output following schemas defined in the treatment module configuration.
- **Chat persistence**: Chat messages are persisted in the database per session, allowing therapists to revisit conversation history.
