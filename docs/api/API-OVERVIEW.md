# API Overview

> StoryCare REST API -- Next.js App Router route handlers with Firebase authentication, Zod validation, and HIPAA audit logging.

---

## At a Glance

| Metric | Value |
|---|---|
| **Total Route Files** | 181 |
| **Unique Endpoint Paths** | 153 |
| **API Domains** | 28 |
| **Auth Pattern** | Bearer token (Firebase ID Token) |
| **Validation** | Zod schemas |
| **Audit Logging** | HIPAA-compliant `audit_logs` table |

---

## Authentication Pattern

All protected endpoints require a Firebase ID token in the `Authorization` header. The token is verified server-side via Firebase Admin SDK, and the user's role is fetched from the database (not Firebase claims).

```typescript
// Client-side request
const response = await fetch('/api/sessions', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json',
  },
});
```

```typescript
// Server-side verification (src/utils/AuthHelpers.ts)
import { requireAuth, requireRole, requireTherapist } from '@/utils/AuthHelpers';

export async function GET(request: Request) {
  try {
    // Option 1: Any authenticated user
    const user = await requireAuth(request);

    // Option 2: Specific roles only
    const user = await requireRole(request, ['therapist', 'org_admin']);

    // Option 3: Convenience wrappers
    const user = await requireTherapist(request);  // therapist + org_admin + super_admin
    const user = await requireAdmin(request);      // org_admin + super_admin

    // user object: { uid, email, role, organizationId, dbUserId }
  } catch (error) {
    return handleAuthError(error);
  }
}
```

> **Note:** `verifyIdToken()` performs a database lookup on every request to fetch the user's current role and organization. Invited users are auto-activated on first login.

---

## Standard Error Response Format

All API endpoints return errors in a consistent JSON format:

```json
{
  "error": "Human-readable error message"
}
```

| Status Code | Meaning |
|---|---|
| `400` | Bad Request -- Invalid input or validation failure |
| `401` | Unauthorized -- Missing or invalid Bearer token |
| `403` | Forbidden -- User lacks the required role |
| `404` | Not Found -- Resource does not exist |
| `409` | Conflict -- Duplicate resource |
| `500` | Internal Server Error |

---

## Rate Limiting

> **Note:** Arcjet was previously configured for rate limiting and WAF but has been **removed** from the project. Rate limiting is not currently enforced at the application layer. Vercel's built-in DDoS protection and Edge rate limiting provide baseline protection.

---

## HIPAA Audit Logging

All endpoints that access Protected Health Information (PHI) log to the `audit_logs` table via `src/libs/AuditLogger.ts`. Audit entries capture:

- **Who**: `userId`, `organizationId`
- **What**: `action` (create, read, update, delete), `resourceType`, `resourceId`
- **When**: Automatic timestamp
- **Where**: `ipAddress`, `userAgent`, `requestMethod`, `requestPath`
- **Why**: `metadata` JSON (e.g., `{ isPHI: true, accessReason: 'clinical_workflow' }`)

Convenience helpers: `logPHIAccess()`, `logPHICreate()`, `logPHIUpdate()`, `logPHIDelete()`, `logBulkPHIAccess()`

---

## Master Endpoint Index

### Authentication (`/api/auth`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/auth/session` | POST, DELETE | Yes (POST) / No (DELETE) | Create/destroy session cookie |
| `/api/auth/me` | GET | Yes | Get current user profile |
| `/api/auth/check-invitation` | GET | No | Verify pending invitation by email |
| `/api/auth/validate-invitation-token` | POST | No | Validate invitation token |
| `/api/auth/link-firebase-uid` | POST | No | Link Firebase UID to invited user |
| `/api/auth/rollback-firebase-account` | POST | No | Rollback failed Firebase account creation |
| `/api/auth/forgot-password` | POST | No | Send password reset email |
| `/api/auth/reset-password` | POST | No | Reset password with token |
| `/api/auth/debug-log-credentials` | POST | No | Debug credential logging (dev) |

### Dashboard (`/api/dashboard`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/dashboard/stats` | GET | Yes | Therapist dashboard statistics |
| `/api/dashboard/patient-engagement` | GET | Yes | Patient engagement metrics |
| `/api/dashboard/recent-responses` | GET | Yes | Recent patient responses |

### Sessions (`/api/sessions`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/sessions` | GET, POST | Yes | List/create therapy sessions |
| `/api/sessions/recent` | GET | Yes | Get recent sessions |
| `/api/sessions/upload` | POST | Yes | Upload session audio file |
| `/api/sessions/upload-url` | POST | Yes | Get presigned upload URL |
| `/api/sessions/upload-confirm` | POST | Yes | Confirm upload completion |
| `/api/sessions/[id]` | GET, PUT, DELETE | Yes | Session CRUD |
| `/api/sessions/[id]/transcript` | GET, POST | Yes | Get/create transcript |
| `/api/sessions/[id]/transcribe` | POST | Yes | Trigger Deepgram transcription |
| `/api/sessions/[id]/speakers` | GET, PUT | Yes | Manage session speakers |
| `/api/sessions/[id]/speakers/merge` | POST | Yes | Merge duplicate speakers |
| `/api/sessions/[id]/speakers/[speakerId]` | GET | Yes | Get speaker details |
| `/api/sessions/[id]/speakers/[speakerId]/audio` | GET | Yes | Get speaker audio |
| `/api/sessions/[id]/speakers/[speakerId]/utterances` | GET | Yes | Get speaker utterances |
| `/api/sessions/[id]/speakers/[speakerId]/utterances/[utteranceId]` | PATCH | Yes | Update utterance |
| `/api/sessions/[id]/chat` | GET, POST | Yes | AI chat for session analysis |
| `/api/sessions/[id]/summary` | GET | Yes | Get AI session summary |
| `/api/sessions/[id]/assign-module` | POST | Yes | Assign treatment module |
| `/api/sessions/[id]/analyze-with-module` | POST | Yes | Run AI analysis with module |
| `/api/sessions/[id]/ai-prompts` | GET | Yes | Get available AI prompts |
| `/api/sessions/[id]/archive` | POST, DELETE | Yes | Archive/unarchive session |

### Recordings (`/api/recordings`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/recordings` | GET, POST | Yes | List/create recordings |
| `/api/recordings/[id]` | GET, DELETE | Yes | Recording CRUD |
| `/api/recordings/[id]/chunks` | GET, POST | Yes | Audio chunk management |
| `/api/recordings/[id]/stop` | POST | Yes | Stop recording |
| `/api/recordings/[id]/finalize` | POST | Yes | Finalize recording |
| `/api/recordings/[id]/merge-status` | GET | Yes | Check merge status |
| `/api/recordings/[id]/retry-merge` | POST | Yes | Retry failed merge |
| `/api/recordings/[id]/create-session` | POST | Yes | Create session from recording |

### Recording Links (`/api/recording-links`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/recording-links` | GET, POST | Yes | List/create shareable recording links |
| `/api/recording-links/[id]` | GET, DELETE | Yes | Recording link CRUD |

### Record (Public) (`/api/record`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/record/[token]` | GET | No | Validate recording token |
| `/api/record/[token]/start` | POST | No | Start recording via link |
| `/api/record/[token]/chunk` | POST | No | Upload audio chunk |
| `/api/record/[token]/complete` | POST | No | Complete recording |
| `/api/record/[token]/status` | GET | No | Check recording status |

### Patients (`/api/patients`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/patients` | GET, POST | Yes | List/create patients |
| `/api/patients/upload-image` | POST | Yes | Upload patient image |
| `/api/patients/[id]` | GET, PUT, DELETE | Yes | Patient CRUD |
| `/api/patients/[id]/responses` | GET | Yes | Get patient responses |
| `/api/patients/[id]/reference-images` | GET, POST | Yes | Manage reference images |
| `/api/patients/[id]/reference-images/[imageId]` | PATCH, DELETE | Yes | Update/delete reference image |
| `/api/patients/[id]/archive` | POST, DELETE | Yes | Archive/unarchive patient |
| `/api/patients/[id]/resend-invitation` | POST | Yes | Resend invitation email |
| `/api/patients/[id]/assessments` | GET, POST | Yes | Patient assessments |

### Therapists (`/api/therapists`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/therapists` | GET, POST | Yes | List/create therapists |
| `/api/therapists/me` | GET, PATCH | Yes | Current therapist profile |
| `/api/therapists/upload-avatar` | POST | Yes | Upload therapist avatar |
| `/api/therapists/[id]` | GET, PATCH, DELETE | Yes | Therapist CRUD |
| `/api/therapists/[id]/assign-patients` | POST | Yes | Assign patients to therapist |
| `/api/therapists/[id]/report` | GET | Yes | Therapist report |
| `/api/therapists/[id]/resend-invitation` | POST | Yes | Resend invitation |
| `/api/therapists/[id]/status` | PATCH | Yes | Update therapist status |

### Users (`/api/users`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/users/[id]/change-role` | POST | Yes (super_admin) | Change user role |

### Groups (`/api/groups`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/groups` | GET, POST | Yes | List/create patient groups |
| `/api/groups/[id]` | GET, PUT, DELETE | Yes | Group CRUD |
| `/api/groups/[id]/members` | GET | Yes | Get group members |

### Media (`/api/media`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/media` | GET, POST | Yes | List/create media items |
| `/api/media/upload` | POST | Yes | Upload media file |
| `/api/media/signed-url` | GET | Yes | Get presigned download URL |
| `/api/media/download` | GET | Yes | Download media file |
| `/api/media/[id]` | GET, PUT, PATCH, DELETE | Yes | Media CRUD |
| `/api/media/[id]/extract-frame` | POST | Yes | Extract frame from video |
| `/api/media/[id]/extract-frame/status` | GET | Yes | Check frame extraction status |

### AI Services (`/api/ai`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/ai/chat` | POST | Yes | AI chat completion |
| `/api/ai/clear-chat` | DELETE | Yes | Clear chat history |
| `/api/ai/generate-image` | POST | Yes | Generate image (Atlas Cloud) |
| `/api/ai/generated-image/save` | POST | Yes | Save generated image to library |
| `/api/ai/generate-video` | POST | Yes | Generate video (Atlas Cloud) |
| `/api/ai/generate-music` | POST | Yes | Generate music (Suno) |
| `/api/ai/generate-scenes` | POST | Yes | AI scene suggestions |
| `/api/ai/generate-prompt-json` | POST | Yes | Generate prompt JSON structure |
| `/api/ai/optimize-prompt` | POST | Yes | Optimize user prompt |
| `/api/ai/suggest-music-options` | POST | Yes | AI music suggestions |
| `/api/ai/extract-quotes` | POST | Yes | Extract quotes from transcript |
| `/api/ai/video-task/[taskId]` | GET | Yes | Poll video generation task |
| `/api/ai/video-tasks` | GET | Yes | List video tasks |
| `/api/ai/music-task/[taskId]` | GET | Yes | Poll music generation task |
| `/api/ai/music-tasks` | GET, POST, PATCH | Yes | Music task management |
| `/api/ai/frame-extraction-tasks` | GET | Yes | List frame extraction tasks |

### Models (`/api/models`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/models` | GET | Yes | Get active models by category |

### Scenes (`/api/scenes`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/scenes` | GET, POST | Yes | List/create scenes |
| `/api/scenes/[id]` | GET, PUT, DELETE | Yes | Scene CRUD |
| `/api/scenes/[id]/clips` | GET, POST, PUT | Yes | Scene clip management |
| `/api/scenes/[id]/clips/[clipId]` | PUT, DELETE | Yes | Clip CRUD |
| `/api/scenes/[id]/audio-tracks` | GET, POST, DELETE | Yes | Scene audio tracks |
| `/api/scenes/[id]/audio-tracks/[trackId]` | PATCH, DELETE | Yes | Audio track CRUD |
| `/api/scenes/[id]/assemble` | GET, POST | Yes | Assemble scene video (sync) |
| `/api/scenes/[id]/assemble-async` | GET, POST | Yes | Assemble scene video (async) |

### Pages (`/api/pages`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/pages` | GET, POST | Yes | List/create story pages |
| `/api/pages/[id]` | GET, PUT, DELETE | Yes | Story page CRUD |
| `/api/pages/[id]/responses` | POST | Yes | Submit page responses |
| `/api/pages/[id]/share` | GET, POST, DELETE | Yes | Manage share links |
| `/api/pages/[id]/share/[linkId]` | DELETE | Yes | Delete specific share link |

### Share (Public) (`/api/share`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/share/[token]` | GET | No | View shared story page |
| `/api/share/[token]/submit` | POST | No | Submit response to shared page |

### Modules (`/api/modules`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/modules` | GET, POST | Yes | List/create treatment modules |
| `/api/modules/[id]` | GET, PUT, DELETE | Yes | Module CRUD |
| `/api/modules/[id]/generate-story-page` | POST | Yes | Generate story page from module |

### Templates (`/api/templates`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/templates/reflections` | GET, POST | Yes | Reflection templates |
| `/api/templates/surveys` | GET, POST | Yes | Survey templates |
| `/api/templates/pending` | GET | Yes | Pending approval templates |
| `/api/templates/[type]/[id]/approve` | POST | Yes (admin) | Approve template |
| `/api/templates/[type]/[id]/reject` | POST | Yes (admin) | Reject template |

### Prompts (`/api/prompts`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/prompts` | GET, POST | Yes | List/create AI prompts |
| `/api/prompts/[id]` | PUT, DELETE | Yes | Prompt CRUD |

### Quotes (`/api/quotes`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/quotes` | GET, POST | Yes | List/create quotes |
| `/api/quotes/[id]` | GET, PUT, DELETE | Yes | Quote CRUD |

### Notes (`/api/notes`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/notes` | GET, POST | Yes | List/create notes |
| `/api/notes/[id]` | GET, PUT, DELETE | Yes | Note CRUD |

### Questions (`/api/questions`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/questions/reflection` | GET | Yes | Get reflection questions |
| `/api/questions/survey` | GET | Yes | Get survey questions |

### Responses (`/api/responses`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/responses/reflection` | POST | Yes | Submit reflection response |
| `/api/responses/survey` | POST | Yes | Submit survey response |

### Assessments (`/api/assessments`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/assessment-instruments` | GET | Yes | List active instruments |
| `/api/assessments` | GET | Yes | List assessment sessions |
| `/api/assessments/[sessionId]` | GET, PATCH, DELETE | Yes | Assessment session CRUD |
| `/api/assessments/[sessionId]/responses` | POST | Yes | Save assessment responses |
| `/api/assessments/[sessionId]/complete` | POST | Yes | Complete assessment with scoring |

### Notifications (`/api/notifications`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/notifications` | GET, POST | Yes | List/create notifications |

### Video Processing (`/api/video`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/video/transcode` | POST | Yes | Start video transcoding job |
| `/api/video/transcode/[jobId]` | GET | Yes | Check transcoding status |
| `/api/video/transcoded/[filename]` | GET | Yes | Get transcoded video |
| `/api/video-jobs` | GET, POST | Yes | List/create video jobs |
| `/api/video-jobs/[id]` | GET, DELETE | Yes | Video job CRUD |

### Audio (`/api/audio`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/audio/[...path]` | GET | Yes | Proxy audio file from GCS |

### Workflows (`/api/workflows`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/workflows/execute` | GET, POST, PUT | Yes | Execute/resume/get workflow |

### Therapist Portal (`/api/therapist`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/therapist/modules` | GET, POST | Yes | Therapist modules |
| `/api/therapist/modules/[id]` | GET, PUT, DELETE | Yes | Therapist module CRUD |
| `/api/therapist/templates` | GET, POST | Yes | Therapist templates |
| `/api/therapist/templates/[id]` | GET, PUT, DELETE | Yes | Therapist template CRUD |
| `/api/therapist/prompts` | GET, POST | Yes | Therapist prompts |
| `/api/therapist/prompts/[id]` | GET, PATCH, DELETE | Yes | Therapist prompt CRUD |
| `/api/therapist/prompts/order` | GET, PUT, DELETE | Yes | Prompt ordering |
| `/api/therapist/responses` | GET | Yes | Patient responses overview |
| `/api/therapist/responses/[pageId]` | GET | Yes | Responses for a page |

### Org Admin (`/api/org-admin`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/org-admin/organization` | GET, PATCH | Yes (org_admin) | Organization details |
| `/api/org-admin/metrics` | GET | Yes (org_admin) | Organization metrics |
| `/api/org-admin/modules` | GET, POST | Yes (org_admin) | Organization modules |
| `/api/org-admin/modules/[id]` | GET, PUT, DELETE | Yes (org_admin) | Module CRUD |
| `/api/org-admin/templates` | GET, POST | Yes (org_admin) | Organization templates |
| `/api/org-admin/templates/[id]` | GET, PUT | Yes (org_admin) | Template CRUD |
| `/api/org-admin/prompts` | GET, POST | Yes (org_admin) | Organization prompts |
| `/api/org-admin/prompts/[id]` | GET, PATCH, DELETE | Yes (org_admin) | Prompt CRUD |
| `/api/org-admins` | POST | Yes (super_admin) | Create org admin |
| `/api/org-admins/[id]/resend-invitation` | POST | Yes (super_admin) | Resend invitation |

### Organizations (`/api/organizations`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/organizations` | GET, POST | Yes (super_admin) | List/create organizations |
| `/api/organizations/[id]` | GET, PATCH, DELETE | Yes (super_admin) | Organization CRUD |

### Super Admin (`/api/super-admin`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/super-admin/metrics` | GET | Yes (super_admin) | Platform metrics |
| `/api/super-admin/settings` | GET, PUT | Yes (super_admin) | Platform settings |
| `/api/super-admin/audit` | GET | Yes (super_admin) | Audit logs |
| `/api/super-admin/users` | GET | Yes (super_admin) | All users |
| `/api/super-admin/templates` | GET, POST | Yes (super_admin) | System templates |
| `/api/super-admin/templates/[id]` | GET, PUT | Yes (super_admin) | Template CRUD |
| `/api/super-admin/module-templates` | GET, POST | Yes (super_admin) | Module templates |
| `/api/super-admin/module-templates/[id]` | GET, PUT, DELETE | Yes (super_admin) | Module template CRUD |
| `/api/super-admin/prompts` | GET, POST | Yes (super_admin) | System prompts |
| `/api/super-admin/prompts/[id]` | GET, PATCH, DELETE | Yes (super_admin) | Prompt CRUD |
| `/api/super-admin/ai-models` | GET, POST | Yes (super_admin) | AI model management |
| `/api/super-admin/ai-models/[id]` | GET, PATCH, DELETE | Yes (super_admin) | AI model CRUD |
| `/api/super-admin/ai-models/bulk` | PUT | Yes (super_admin) | Bulk update models |
| `/api/super-admin/assessment-instruments` | GET, POST | Yes (super_admin) | Assessment instruments |
| `/api/super-admin/assessment-instruments/[id]` | GET, PATCH, DELETE | Yes (super_admin) | Instrument CRUD |
| `/api/super-admin/pending-invitations` | GET | Yes (super_admin) | Pending invitations |
| `/api/super-admin/pending-invitations/count` | GET | Yes (super_admin) | Pending count |
| `/api/super-admin/pending-invitations/[id]` | PATCH | Yes (super_admin) | Approve/reject invitation |

### Webhooks (`/api/webhooks`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/webhooks/suno` | POST | No (webhook secret) | Suno music generation callback |
| `/api/webhooks/paubox` | POST | No (webhook secret) | Paubox email status callback |

### Trial (`/api/trial`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/trial/patients` | POST | Yes | Create trial patient |

### Health (`/api/health`)

| Endpoint | Methods | Auth Required | Description |
|---|---|---|---|
| `/api/health` | GET, HEAD | No | Health check with database ping |

---

## Key Source Files

| File | Purpose |
|---|---|
| `src/utils/AuthHelpers.ts` | `requireAuth()`, `requireRole()`, `requireTherapist()`, `requireAdmin()`, `handleAuthError()` |
| `src/libs/FirebaseAdmin.ts` | `verifyIdToken()` -- Firebase token verification + DB role lookup |
| `src/libs/AuditLogger.ts` | HIPAA audit logging helpers |
| `src/services/AuditService.ts` | Audit log database operations |
| `src/middleware.ts` | Session cookie verification, security headers |
