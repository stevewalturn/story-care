# Session Management

## Overview

Sessions are the core workflow unit in StoryCare. A therapy session represents a recorded audio interaction between a therapist and one or more patients. The session lifecycle involves audio upload to Google Cloud Storage, transcription via Deepgram, speaker labeling, AI-powered analysis with treatment modules, and media generation. Sessions support both individual (one patient) and group (multiple patients) formats.

## User Roles

| Role | Access Level |
|------|-------------|
| Super Admin | Can view all sessions across the platform |
| Org Admin | Can view all sessions within their organization |
| Therapist | Can create, view, and manage sessions for their assigned patients |
| Patient | Cannot directly access sessions (views derived content via story pages) |

## User Workflow

### Session Creation
1. Therapist selects patient(s) and session date on the sessions page.
2. Therapist uploads an audio file (up to 500 MB) via the upload flow.
3. Client requests a signed upload URL from `POST /api/sessions/upload-url`.
4. Client uploads audio directly to GCS using the signed URL (bypasses server size limits).
5. Client confirms upload via `POST /api/sessions/upload-confirm` with the GCS path.
6. System creates the session record with `transcriptionStatus: 'pending'`.
7. For group sessions with multiple patients, an auto-generated group is created.

### Session Lifecycle
1. **Created** - Session record exists with audio URL; `transcriptionStatus: 'pending'`.
2. **Transcribing** - Therapist triggers transcription; status changes to `processing`.
3. **Transcribed** - Deepgram completes; transcript, speakers, and utterances are stored; status: `completed`.
4. **Speaker Setup** - Therapist labels speakers (therapist vs. patient); `speakersSetupCompleted: true`.
5. **Analysis** - Therapist assigns a treatment module and runs AI analysis.
6. **Media Generation** - Therapist generates images, videos, and music from session content.
7. **Archived** - Therapist archives completed sessions; `archivedAt` timestamp is set.

### Module Assignment
1. Therapist assigns a treatment module to a session via `POST /api/sessions/[id]/assign-module`.
2. System creates a `session_modules` record linking session to module.
3. Therapist triggers AI analysis with the module via `POST /api/sessions/[id]/analyze-with-module`.
4. Analysis results are stored in `session_modules.aiAnalysisResult`.

## UI Pages

| Page | Path | Description |
|------|------|-------------|
| Sessions List | `/sessions` | All sessions for the therapist, filterable by patient/group/date |
| Session Detail | `/sessions/[id]` | Session workspace: transcript, speakers, AI chat, media generation |
| Upload Modal | `/sessions` (modal) | Audio file upload with patient/group selection |

## API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/sessions` | List sessions with filters (patientId, groupId, dateRange, archived) | Bearer token (therapist+) |
| POST | `/api/sessions` | Create session with audio URL, patient(s), and session type | Bearer token (therapist+) |
| GET | `/api/sessions/[id]` | Get single session with full details | Bearer token (therapist+) |
| PUT | `/api/sessions/[id]` | Update session metadata | Bearer token (therapist+) |
| DELETE | `/api/sessions/[id]` | Soft-delete session | Bearer token (therapist+) |
| POST | `/api/sessions/[id]/archive` | Archive/unarchive session | Bearer token (therapist+) |
| GET | `/api/sessions/recent` | Get recently accessed sessions | Bearer token (therapist+) |
| POST | `/api/sessions/upload-url` | Generate signed GCS upload URL (15-minute expiry, 500 MB limit) | Bearer token (therapist+) |
| POST | `/api/sessions/upload` | Direct audio upload (legacy, smaller files) | Bearer token (therapist+) |
| POST | `/api/sessions/upload-confirm` | Confirm upload and create session record | Bearer token (therapist+) |
| POST | `/api/sessions/[id]/assign-module` | Assign treatment module to session | Bearer token (therapist+) |
| POST | `/api/sessions/[id]/analyze-with-module` | Run AI analysis with assigned module | Bearer token (therapist+) |
| GET | `/api/sessions/[id]/summary` | Get or generate session summary | Bearer token (therapist+) |
| GET | `/api/sessions/[id]/ai-prompts` | Get available AI prompts for session | Bearer token (therapist+) |

## Database Tables

| Table | Role in Feature |
|-------|----------------|
| `sessions` | Core session record: `id`, `therapistId`, `patientId`, `groupId`, `title`, `sessionDate`, `sessionType` (individual/group), `audioUrl`, `audioDurationSeconds`, `transcriptionStatus`, `moduleId`, `moduleAssignedAt`, `speakersSetupCompleted`, `lastOpenedAt`, `archivedAt`, `deletedAt` |
| `session_modules` | Links sessions to treatment modules: `sessionId`, `moduleId`, `assignedBy`, `assignedAt`, `aiAnalysisCompleted`, `aiAnalysisResult`, `storyPageId` |
| `transcripts` | Full transcript text per session |
| `speakers` | Identified speakers with labels and duration |
| `utterances` | Individual speech segments with timestamps and speaker references |
| `groups` | Group records for multi-patient sessions |
| `group_members` | Group membership (patient -> group) |
| `treatment_modules` | Therapeutic module definitions |

## Key Files

| File | Purpose |
|------|---------|
| `src/app/api/sessions/route.ts` | GET (list with filters, presigned URLs, HIPAA audit) and POST (create session with auto-group creation) |
| `src/app/api/sessions/[id]/route.ts` | Single session CRUD operations |
| `src/app/api/sessions/upload-url/route.ts` | Generates signed GCS upload URLs; validates file type (audio only) and size (500 MB); rate-limited |
| `src/app/api/sessions/upload-confirm/route.ts` | Confirms upload completion and creates session record |
| `src/app/api/sessions/[id]/assign-module/route.ts` | Assigns treatment module to session |
| `src/app/api/sessions/[id]/analyze-with-module/route.ts` | Triggers AI analysis using assigned module |
| `src/app/api/sessions/[id]/archive/route.ts` | Archive/unarchive sessions |
| `src/services/SessionService.ts` | Business logic: `assignModuleToSession`, `getSessionWithModule`, `updateSessionModuleAnalysis`, `getSessionsWithModules`, `removeModuleFromSession` |
| `src/services/SessionSummaryService.ts` | Session summary generation |
| `src/middleware/RBACMiddleware.ts` | `requireSessionAccess` - verifies user can access a specific session |

## Technical Notes

- **Signed upload URLs**: Audio uploads use a two-step process. The client first requests a signed GCS URL (v4, 15-minute expiry), then uploads directly to GCS. This bypasses the 32 MB Cloud Run/Vercel request limit and supports files up to 500 MB.
- **Allowed audio formats**: MP3, WAV, M4A, MP4, WebM, OGG, AAC, FLAC.
- **Auto-group creation**: When creating a group session without an explicit `groupId`, the system auto-creates a group named "Session - [title] (date)" and adds all specified patients as members.
- **Session ordering**: Sessions are ordered by `COALESCE(lastOpenedAt, updatedAt)` descending, putting recently accessed sessions first.
- **Archive filter**: The sessions list defaults to showing non-archived sessions. Pass `?archived=true` to see archived sessions.
- **Speaker setup gate**: Only sessions with `speakersSetupCompleted: true` appear in the main sessions list. This ensures the therapist has completed the speaker labeling step.
- **HIPAA audit logging**: All session list and detail accesses are logged via `logPHIAccess`.
- **Presigned URLs**: Audio URLs, patient avatar URLs, and reference image URLs are re-signed with 1-hour expiry on every API response.
- **Soft delete**: Sessions use `deletedAt` for soft deletion, filtered out in queries.
