# Environment Variables Reference

> **Source of truth**: `src/libs/Env.ts`
> All environment variables are validated at build time using [T3 Env](https://env.t3.gg/) (`@t3-oss/env-nextjs`).
> Variables are categorized as `server` (never exposed to the browser), `client` (prefixed with `NEXT_PUBLIC_`), or `shared`.

---

## Overview

| Category | Total Vars | Required | Optional |
|----------|-----------|----------|----------|
| Firebase Client (browser) | 7 | 6 | 1 |
| Firebase Server | 3 | 0 | 3 |
| Database | 1 | 1 | 0 |
| Google Cloud Storage | 4 | 0 | 4 |
| AI Services | 4 | 0 | 4 |
| Email (Paubox) | 2 | 0 | 2 |
| Video Processing (Cloud Run) | 4 | 0 | 4 |
| Observability (Langfuse) | 3 | 0 | 3 |
| Analytics (PostHog) | 2 | 0 | 2 |
| Customer Support (Intercom) | 2 | 0 | 2 |
| Security (Webhook) | 1 | 0 | 1 |
| Trial API | 1 | 0 | 1 |
| App | 1 | 0 | 1 |
| Shared | 1 | 0 | 1 |
| **Total** | **36** | **7** | **29** |

> **Required** means the build will fail without it. **Optional** means the feature degrades gracefully or is disabled.

---

## Firebase Client (Browser-Side)

These variables are exposed to the browser (prefixed with `NEXT_PUBLIC_`). They configure the Firebase JS SDK for authentication.

| Variable | Required | Validation | Example | Description |
|----------|----------|------------|---------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | `z.string().min(1)` | `AIzaSyB1a2c3d4e5f6g7h8i9j0` | Firebase Web API key from Google Cloud Console |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | `z.string().min(1)` | `myproject.firebaseapp.com` | Firebase Auth domain for OAuth redirects |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | `z.string().min(1)` | `storycare-prod` | Google Cloud / Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | `z.string().min(1)` | `storycare-prod.appspot.com` | Firebase Storage bucket (default bucket) |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | `z.string().min(1)` | `123456789012` | Firebase Cloud Messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | `z.string().min(1)` | `1:123456789012:web:abc123def456` | Firebase app ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | No | `z.string().optional()` | `G-ABCDEF1234` | Google Analytics measurement ID |

> **Note**: These are safe to expose publicly. They identify the Firebase project but do not grant any access. Security is enforced server-side via Firebase Security Rules and Admin SDK verification.

---

## Firebase Server

Server-only variables for the Firebase Admin SDK. Used in `src/libs/FirebaseAdmin.ts` to verify ID tokens and manage users.

| Variable | Required | Validation | Example | Description |
|----------|----------|------------|---------|-------------|
| `FIREBASE_PROJECT_ID` | No | `z.string().min(1).optional()` | `storycare-prod` | Firebase project ID for Admin SDK initialization |
| `FIREBASE_CLIENT_EMAIL` | No | `z.string().email().optional()` | `firebase-adminsdk-abc@storycare-prod.iam.gserviceaccount.com` | Service account email for Admin SDK |
| `FIREBASE_PRIVATE_KEY` | No | `z.string().min(1).optional()` | `-----BEGIN PRIVATE KEY-----\nMIIE...` | Service account private key (PEM format, `\n` escaped) |

> **Important**: The private key contains literal `\n` characters when stored in environment variables. The code replaces them: `privateKey.replace(/\\n/g, '\n')`.

---

## Database

| Variable | Required | Validation | Example | Description |
|----------|----------|------------|---------|-------------|
| `DATABASE_URL` | Yes | `z.string().min(1)` | `postgresql://user:pass@ep-cool-name-123.us-east-2.aws.neon.tech/storycare?sslmode=require` | PostgreSQL connection string. Neon for production, PGlite for local dev. |

> **Connection pooling**: Configured in `src/utils/DBConnection.ts` -- 5 connections (dev), 10 (production), 30s idle timeout.

---

## Google Cloud Storage

Server-only variables for media file storage via `@google-cloud/storage`. Configured in `src/libs/GCS.ts`.

| Variable | Required | Validation | Example | Description |
|----------|----------|------------|---------|-------------|
| `GCS_PROJECT_ID` | No | `z.string().min(1).optional()` | `storycare-prod` | Google Cloud project ID for GCS |
| `GCS_CLIENT_EMAIL` | No | `z.string().email().optional()` | `gcs-uploader@storycare-prod.iam.gserviceaccount.com` | Service account email with GCS permissions |
| `GCS_PRIVATE_KEY` | No | `z.string().min(1).optional()` | `-----BEGIN PRIVATE KEY-----\nMIIE...` | Service account private key (PEM format) |
| `GCS_BUCKET_NAME` | No | `z.string().min(1).optional()` | `storycare-media-prod` | GCS bucket name for storing media assets |

> **Tip**: The GCS service account needs `roles/storage.objectCreator` and `roles/storage.objectViewer` at minimum.

---

## AI Services

### Deepgram (Speech-to-Text)

| Variable | Required | Validation | Example | Description |
|----------|----------|------------|---------|-------------|
| `DEEPGRAM_API_KEY` | No | `z.string().optional()` | `dg_1a2b3c4d5e6f7g8h9i0j` | Deepgram API key for audio transcription |

### OpenAI (Text Generation)

| Variable | Required | Validation | Example | Description |
|----------|----------|------------|---------|-------------|
| `OPENAI_API_KEY` | No | `z.string().optional()` | `sk-proj-abc123...` | OpenAI API key for GPT-4 text generation and chat |

### Suno AI (Music Generation)

| Variable | Required | Validation | Example | Description |
|----------|----------|------------|---------|-------------|
| `SUNO_API_KEY` | No | `z.string().optional()` | `suno_abc123...` | Suno AI API key for music generation |
| `SUNO_WEBHOOK_SECRET` | No | `z.string().optional()` | `whsec_abc123...` | Secret for verifying Suno webhook callbacks |

---

## Email (Paubox)

HIPAA-compliant email service. Configured in `src/libs/Paubox.ts`. Used for patient notifications, invitations, and reminders.

| Variable | Required | Validation | Example | Description |
|----------|----------|------------|---------|-------------|
| `PAUBOX_API_KEY` | No | `z.string().min(1).optional()` | `pk_abc123...` | Paubox API key for sending encrypted emails |
| `PAUBOX_API_USERNAME` | No | `z.string().min(1).optional()` | `storycare` | Paubox account username (used in API requests) |

> **HIPAA Note**: Paubox is used instead of SendGrid/Mailgun because it provides automatic email encryption required for PHI transmission.

---

## Video Processing (Cloud Run)

Server-only variables for Google Cloud Run video processing jobs. Used in `src/services/VideoService.ts` and `src/services/VideoTranscodingService.ts`.

| Variable | Required | Validation | Example | Description |
|----------|----------|------------|---------|-------------|
| `VIDEO_PROCESSOR_URL` | No | `z.string().url().optional()` | `https://video-processor-abc123-uc.a.run.app` | Cloud Run service URL for video processing API |
| `WEBHOOK_SECRET` | No | `z.string().min(1).optional()` | `whsec_v1d30pr0c...` | Secret for verifying video processing webhooks |
| `CLOUD_RUN_JOB_NAME` | No | `z.string().min(1).optional()` | `video-transcoder` | Cloud Run Job name for GPU transcoding |
| `CLOUD_RUN_REGION` | No | `z.string().min(1).optional()` | `us-central1` | Google Cloud region for Cloud Run jobs |

---

## Observability (Langfuse)

AI observability and tracing. Tracks LLM calls, costs, and performance. Configured in `src/libs/LangfuseTracing.ts`.

| Variable | Required | Validation | Example | Description |
|----------|----------|------------|---------|-------------|
| `LANGFUSE_PUBLIC_KEY` | No | `z.string().min(1).optional()` | `pk-lf-abc123...` | Langfuse public key for trace identification |
| `LANGFUSE_SECRET_KEY` | No | `z.string().min(1).optional()` | `sk-lf-abc123...` | Langfuse secret key for authenticated API access |
| `LANGFUSE_BASE_URL` | No | `z.string().url().optional()` | `https://cloud.langfuse.com` | Langfuse API base URL (cloud or self-hosted) |

---

## Analytics (PostHog)

Product analytics for tracking user behavior and feature adoption. Client-side integration.

| Variable | Required | Validation | Example | Description |
|----------|----------|------------|---------|-------------|
| `NEXT_PUBLIC_POSTHOG_KEY` | No | `z.string().optional()` | `phc_abc123...` | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | `z.string().optional()` | `https://us.i.posthog.com` | PostHog instance URL (cloud or self-hosted) |

---

## Customer Support (Intercom)

In-app customer support chat widget.

| Variable | Required | Validation | Example | Description |
|----------|----------|------------|---------|-------------|
| `NEXT_PUBLIC_INTERCOM_APP_ID` | No | `z.string().optional()` | `abc123de` | Intercom application ID for the chat widget |
| `INTERCOM_SECRET_KEY` | No | `z.string().min(1).optional()` | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | Intercom identity verification secret (server-only). Found in Intercom Settings > Security > "Enforce identity on web". When set, the widget boots with a signed JWT to prevent user impersonation. |

---

## Security

| Variable | Required | Validation | Example | Description |
|----------|----------|------------|---------|-------------|
| `WEBHOOK_SECRET` | No | `z.string().min(1).optional()` | `whsec_abc123...` | Shared secret for verifying incoming webhook signatures |

> **Note**: `WEBHOOK_SECRET` is shared between video processing webhooks and Suno webhooks. It appears under Video Processing but serves general webhook verification.

---

## Trial API

| Variable | Required | Validation | Example | Description |
|----------|----------|------------|---------|-------------|
| `TRIAL_API_KEY` | No | `z.string().min(1).optional()` | `trial_abc123...` | API key for the trial patient creation endpoint |

---

## App Configuration

| Variable | Required | Validation | Example | Description |
|----------|----------|------------|---------|-------------|
| `NEXT_PUBLIC_APP_URL` | No | `z.string().optional()` | `https://app.storycare.health` | Public-facing application URL. Used in emails and share links. Defaults to `http://localhost:3000` in dev. |

---

## Shared

Variables available on both server and client.

| Variable | Required | Validation | Example | Description |
|----------|----------|------------|---------|-------------|
| `NODE_ENV` | No | `z.enum(['test', 'development', 'production']).optional()` | `production` | Node.js runtime environment. Set automatically by Next.js. |

---

## T3-Env Validation Details

Environment variables are validated using `@t3-oss/env-nextjs` in `src/libs/Env.ts`. This provides:

### Build-Time Safety
T3 Env validates all variables at build time. If a required variable is missing, the build fails immediately with a clear error message -- preventing deployment of misconfigured applications.

### Type Safety
All variables are typed via Zod schemas. Accessing `Env.DATABASE_URL` returns a `string` type, while `Env.LANGFUSE_BASE_URL` returns `string | undefined` for optional variables.

### Client/Server Separation
- **`server`** block: Variables only accessible in server-side code (API routes, Server Components, middleware). Accessing them in client code causes a build error.
- **`client`** block: Variables prefixed with `NEXT_PUBLIC_` that are bundled into client JavaScript. Must be explicitly listed.
- **`shared`** block: Variables accessible on both server and client (e.g., `NODE_ENV`).

### Usage Pattern
```typescript
import { Env } from '@/libs/Env';

// Server-side only
const dbUrl = Env.DATABASE_URL; // string (required)
const deepgramKey = Env.DEEPGRAM_API_KEY; // string | undefined (optional)

// Client-side
const firebaseKey = Env.NEXT_PUBLIC_FIREBASE_API_KEY; // string (required)
const posthogKey = Env.NEXT_PUBLIC_POSTHOG_KEY; // string | undefined (optional)
```

### Runtime Env Mapping
Every variable must be explicitly mapped in the `runtimeEnv` section of the T3 Env config. This ensures that `process.env` lookups are done at runtime (not inlined at build time), which is critical for environments like Vercel where server variables are injected at runtime.

---

## Local Development Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in the required variables (minimum 7):
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `DATABASE_URL`

3. For local development with PGlite, `DATABASE_URL` is automatically provided by the dev server. You may still need it for seed scripts.

4. Optional services (AI, GCS, Paubox, etc.) will gracefully degrade when their variables are absent.

> **Security**: Never commit `.env.local` to version control. It is listed in `.gitignore`.
