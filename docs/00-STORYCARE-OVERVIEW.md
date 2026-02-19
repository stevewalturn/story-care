# StoryCare Platform Overview

> [!NOTE]
> **"We live our lives through stories. These narratives shape identity, behavior, and possibility."**
>
> StoryCare is a digital therapeutic platform that uses narrative therapy to help patients visualize and reframe their stories through AI-generated media. It is a clinician-guided system where therapists upload session audio, leverage AI for transcription and analysis, generate multimedia content, and deliver personalized story pages to patients.

---

## Quick Stats Dashboard

| Metric | Count | Details |
|---|---|---|
| Database Tables | 48 | PostgreSQL via DrizzleORM on Neon |
| Enum Types | 38 | `user_role`, `media_type`, `job_status`, ... |
| API Route Files | 181 | Next.js App Router route handlers |
| HTTP Handlers | 289+ | Individual GET/POST/PUT/PATCH/DELETE exports |
| UI Pages | 60 | Auth-protected + public pages |
| Services | 20 | Business logic layer in `src/services/` |
| AI Providers | 8+ | OpenAI, Gemini, Vertex AI, Stability AI, Fal AI, Atlas Cloud, Suno AI, Deepgram |
| Lib Modules | 25 | Singleton clients in `src/libs/` |
| Migrations | 36 | Drizzle Kit SQL migrations |
| Components | 90+ | React components across 15+ directories |

---

## User Roles

StoryCare defines four distinct roles stored in the database (not Firebase claims). Each role has a dedicated portal and permissions scope.

| Role | Enum Value | Description |
|---|---|---|
| **Super Admin** | `super_admin` | Platform-wide administrative access. Manages all organizations, approves invitations, configures AI models, manages platform settings and audit logs. |
| **Organization Admin** | `org_admin` | Manages users within their organization. Invites therapists, configures org settings, manages org-scoped templates and modules. |
| **Therapist** | `therapist` | Primary user. Uploads and manages therapy sessions, analyzes transcripts with AI, generates visual media, creates story pages for patients, monitors patient engagement. |
| **Patient** | `patient` | End consumer. Views personalized story pages, watches videos and scenes, answers reflection questions, submits survey responses, completes clinical assessments. |

### Capabilities Grid

| Capability | Super Admin | Org Admin | Therapist | Patient |
|---|---|---|---|---|
| Platform settings | Yes | - | - | - |
| Organization management | Yes | Own org | - | - |
| User invitation & approval | Yes | Therapists | Patients | - |
| AI model configuration | Yes | - | - | - |
| Audit log access | Yes | - | - | - |
| Template management | System-wide | Org-scoped | Private | - |
| Module management | System-wide | Org-scoped | View/Use | - |
| Prompt library | System-wide | Org-scoped | Personal | - |
| Session upload & transcribe | - | - | Yes | - |
| AI chat & analysis | - | - | Yes | - |
| Media generation (image/video/music) | - | - | Yes | - |
| Scene editor | - | - | Yes | - |
| Story page builder | - | - | Yes | - |
| View story pages | - | - | Preview | Yes |
| Answer reflections & surveys | - | - | - | Yes |
| Clinical assessments | - | - | Administer | Complete |
| View dashboard metrics | Platform | Org | Own patients | - |

---

## Core Capabilities

### 1. Session Management

Upload therapy session audio recordings, manage session metadata, assign patients or groups, and track processing status. Supports both direct browser recording and shareable recording links for mobile capture.

- Individual and group session types
- Audio upload with GCS storage (presigned URLs)
- Recording links with expiration and status tracking
- Chunked recording with Cloud Run audio merging
- Session archival and soft-delete (HIPAA)

### 2. Transcription & Speaker Diarization

Automatic speech-to-text transcription via Deepgram with speaker diarization. Therapists can label speakers, edit utterances, merge speakers, and extract per-speaker audio segments.

- Deepgram Nova-2 with smart formatting
- Automatic speaker identification (Speaker 0, Speaker 1, ...)
- Manual speaker labeling (therapist, patient, group member)
- Utterance-level timestamps and confidence scores
- Session summary generation with AI

### 3. AI-Powered Analysis

Multi-provider AI chat system with therapeutic prompts, building blocks workflows, and structured JSON output support. Therapists interact through a session-scoped chat interface.

- GPT-4o, Gemini 2.5 Pro, and other text models
- Therapeutic prompt library (system, org, and private scopes)
- Building blocks visual workflow editor
- Structured JSON output with schema validation
- Module-specific analysis with treatment modules
- Conversation summarization for context management

### 4. Media Generation

Generate images, videos, and music from session content using multi-provider AI services. All generated media is stored in a patient-scoped media library.

- **Images**: Vertex AI Imagen 3, Stability AI, Gemini, Atlas Cloud (text-to-image, image-to-image)
- **Videos**: Fal AI, Atlas Cloud (text-to-video, image-to-video)
- **Music**: Suno AI (V4.5/V5) with custom styles, instrumental/vocal modes
- Patient reference images for personalized generation
- Frame extraction from videos
- Media tagging and organization

### 5. Scene Editor & Video Assembly

Compose visual narratives by arranging media clips on a timeline with multiple audio layers. Assemble final videos via Cloud Run FFmpeg jobs.

- Drag-and-drop clip sequencing
- Multiple audio track layers with volume control
- Background music integration (Suno AI)
- Async video assembly via Cloud Run
- Video transcoding (H.264, H.265, VP9, AV1)
- Processing status tracking with polling

### 6. Story Pages

Build interactive patient-facing content pages with rich media blocks, reflection questions, and surveys. Publish and share via secure time-limited links.

- Block-based page builder (video, image, audio, text, quote, note, scene, reflection, survey)
- Draft / Published / Archived status workflow
- Shareable links with configurable expiration
- Patient engagement tracking (views, completion)
- Auto-generation from treatment modules
- Email notifications on publish (HIPAA-compliant via Paubox)

### 7. Clinical Assessments

Administer validated clinical instruments (PCL-5, PHQ-9, etc.) with Likert scales, multi-choice, and free-text items. Track scores over time with subscale breakdowns and clinical cutoffs.

- Instrument library with configurable items
- Assessment sessions with timepoints (screening, baseline, mid-treatment, follow-up)
- Real-time scoring and subscale calculation
- Clinical cutoff interpretation
- Linked to therapy sessions for longitudinal tracking

### 8. Treatment Modules

Pre-built therapeutic modules organized by domain (Self & Strength, Relationships & Repair, Identity Transformation, Purpose & Future). Modules link to AI prompts and drive automated story page generation.

- Four therapeutic domains
- Module-to-prompt linking with sort order
- Session-module assignment and tracking
- AI analysis with structured output
- Automated story page generation workflows
- Org-scoped and system-scoped modules

---

## Quick Links

| Document | Description |
|---|---|
| [01 - Architecture](./01-ARCHITECTURE.md) | System architecture, data flows, deployment topology, and technology decisions |
| [02 - ERD Overview](./02-ERD-OVERVIEW.md) | Entity relationship diagrams grouped by domain with relationship tables |
| [03 - Database Schema Reference](./03-DATABASE-SCHEMA-REFERENCE.md) | Complete column-by-column reference for all 48 tables |
| [CLAUDE.md](../CLAUDE.md) | AI assistant development guide with patterns, commands, and conventions |
| [HIPAA Compliance](./HIPAA-COMPLIANCE.md) | HIPAA security requirements and implementation status |
| [PRD](./PRD.md) | Product Requirements Document |
| [Getting Started](./GETTING_STARTED.md) | Developer setup and onboarding guide |

---

*Last updated: 2026-02-19*
