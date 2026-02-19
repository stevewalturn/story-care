# StoryCare Architecture

> [!NOTE]
> This document describes the system architecture, data flows, deployment topology, and key technology decisions for the StoryCare platform.

---

## System Architecture

```mermaid
graph TB
    subgraph Client["Client (Browser)"]
        NextApp["Next.js 16 App Router<br/>React 19 + React Compiler"]
        FirebaseSDK["Firebase JS SDK<br/>(Auth Client)"]
        PostHog["PostHog Analytics"]
    end

    subgraph Vercel["Vercel (Edge Network)"]
        Middleware["Middleware<br/>Auth + HIPAA Headers + Arcjet"]
        SSR["Server Components"]
        APIRoutes["API Routes (181 files)"]
    end

    subgraph Services["Service Layer (20 services)"]
        SessionSvc["SessionService"]
        MediaSvc["MediaService / VideoService"]
        EmailSvc["EmailService"]
        AuditSvc["AuditService"]
        AssessmentSvc["AssessmentService"]
        ModuleSvc["ModuleService"]
        WorkflowSvc["WorkflowExecutorService"]
        OtherSvc["... 13 more"]
    end

    subgraph Database["Database"]
        Neon["Neon PostgreSQL<br/>(Production)"]
        PGlite["PGlite<br/>(Local Dev)"]
        Drizzle["DrizzleORM"]
    end

    subgraph Storage["Storage & CDN"]
        GCS["Google Cloud Storage<br/>(Media, Audio, Images)"]
    end

    subgraph AI["AI Providers"]
        Deepgram["Deepgram<br/>(Transcription)"]
        OpenAI["OpenAI GPT-4o<br/>(Text Generation)"]
        Gemini["Google Gemini<br/>(Text Generation)"]
        VertexAI["Vertex AI Imagen<br/>(Image Generation)"]
        StabilityAI["Stability AI<br/>(Image Generation)"]
        FalAI["Fal AI<br/>(Video Generation)"]
        AtlasCloud["Atlas Cloud<br/>(Image + Video)"]
        SunoAI["Suno AI<br/>(Music Generation)"]
    end

    subgraph CloudRun["Google Cloud Run"]
        VideoJobs["Video Assembly Jobs<br/>(FFmpeg)"]
        TranscodeJobs["Transcoding Jobs<br/>(GPU)"]
        MergeJobs["Audio Merge Jobs"]
    end

    subgraph Email["Email"]
        Paubox["Paubox<br/>(HIPAA-compliant)"]
    end

    subgraph Observability["Observability"]
        Langfuse["Langfuse<br/>(AI Tracing)"]
        Intercom["Intercom<br/>(Support Chat)"]
    end

    Client --> Vercel
    FirebaseSDK --> GIP["Google Identity Platform"]
    Middleware --> APIRoutes
    APIRoutes --> Services
    Services --> Drizzle
    Drizzle --> Neon
    Drizzle --> PGlite
    Services --> GCS
    Services --> AI
    Services --> CloudRun
    Services --> Paubox
    Services --> Langfuse
    CloudRun --> GCS
    GIP --> Middleware
```

---

## Data Flow Diagrams

### Authentication Flow

```mermaid
sequenceDiagram
    participant Browser
    participant Firebase as Firebase JS SDK
    participant GIP as Google Identity Platform
    participant MW as Middleware
    participant API as API Route
    participant DB as Neon PostgreSQL

    Browser->>Firebase: signInWithEmailAndPassword()
    Firebase->>GIP: Authenticate
    GIP-->>Firebase: ID Token (JWT)
    Firebase-->>Browser: User + ID Token

    Browser->>MW: Request + Authorization: Bearer {token}
    MW->>GIP: verifyIdToken(token)
    GIP-->>MW: Decoded token (uid, email)
    MW->>DB: SELECT * FROM users WHERE firebase_uid = uid
    DB-->>MW: User record (role, org, status)

    alt User status = 'invited'
        MW->>DB: UPDATE users SET status = 'active'
    end

    MW-->>API: Authenticated user context
    API-->>Browser: Response
```

### Session Workflow (Upload to Story Page)

```mermaid
sequenceDiagram
    participant Therapist
    participant API as API Routes
    participant GCS as Cloud Storage
    participant DG as Deepgram
    participant AI as AI Provider
    participant CR as Cloud Run
    participant DB as Database
    participant Patient

    Therapist->>API: Upload audio file
    API->>GCS: Store audio (presigned URL)
    API->>DB: Create session record

    Therapist->>API: Trigger transcription
    API->>DG: Transcribe audio (Nova-2)
    DG-->>API: Transcript + speakers + utterances
    API->>DB: Store transcript, speakers, utterances

    Therapist->>API: Label speakers
    API->>DB: Update speaker names and types

    Therapist->>API: AI Chat / Analyze with module
    API->>AI: Generate analysis (GPT-4o / Gemini)
    AI-->>API: Structured analysis result
    API->>DB: Store chat messages + analysis

    Therapist->>API: Generate image from transcript
    API->>AI: Image generation (Vertex AI / Stability)
    AI-->>API: Generated image
    API->>GCS: Store image
    API->>DB: Add to media library

    Therapist->>API: Create scene + assemble video
    API->>CR: FFmpeg assembly job
    CR->>GCS: Download clips + audio
    CR->>GCS: Upload assembled video
    CR-->>API: Job complete
    API->>DB: Update scene status

    Therapist->>API: Build story page + publish
    API->>DB: Create page + blocks + questions
    API->>API: Send email notification
    API-->>Patient: Email with share link

    Patient->>API: View story page (share token)
    API->>DB: Log page interaction
    Patient->>API: Submit reflections + surveys
    API->>DB: Store responses
```

### Media Generation Flow

```mermaid
sequenceDiagram
    participant Therapist
    participant API as API Routes
    participant Abstraction as Provider Abstraction
    participant Provider as AI Provider
    participant GCS as Cloud Storage
    participant DB as Database
    participant Langfuse as Langfuse Tracing

    Therapist->>API: Generate media request
    API->>Langfuse: Start trace (model, prompt)
    API->>Abstraction: generateImage/Video/Music()
    Abstraction->>DB: Lookup model pricing
    Abstraction->>Provider: Provider-specific API call

    alt Image Generation
        Provider-->>Abstraction: Base64/URL image
        Abstraction->>GCS: Upload to patient folder
    else Video Generation
        Provider-->>Abstraction: Video URL or task ID
        Note over Abstraction: Poll for completion if async
        Abstraction->>GCS: Upload completed video
    else Music Generation
        Provider-->>Abstraction: Task ID (Suno)
        Note over Abstraction: Webhook callback on completion
        Abstraction->>GCS: Upload audio file
    end

    Abstraction-->>API: Media URL + metadata
    API->>DB: Insert into media_library
    API->>Langfuse: End trace (cost, duration)
    API-->>Therapist: Media item response
```

---

## Deployment Architecture

```mermaid
graph LR
    subgraph Developer["Developer Machine"]
        Code["Source Code"]
        PGlite2["PGlite (in-memory DB)"]
    end

    subgraph GitHub["GitHub"]
        Repo["Repository"]
        Actions["GitHub Actions<br/>(CI/CD)"]
    end

    subgraph VercelProd["Vercel (Production)"]
        Edge["Edge Network / CDN"]
        Serverless["Serverless Functions<br/>(API Routes)"]
        Static["Static Assets"]
    end

    subgraph GCP["Google Cloud Platform"]
        GIP2["Identity Platform<br/>(Authentication)"]
        GCS2["Cloud Storage<br/>(Media Files)"]
        CRJobs["Cloud Run Jobs<br/>(Video Processing)"]
    end

    subgraph NeonDB["Neon"]
        PGProd["PostgreSQL<br/>(Production DB)"]
        Pooler["Connection Pooler"]
    end

    subgraph ThirdParty["Third-Party Services"]
        Paubox2["Paubox (Email)"]
        Deepgram2["Deepgram"]
        OpenAI2["OpenAI"]
        Suno2["Suno AI"]
        Langfuse2["Langfuse"]
    end

    Code -->|git push| Repo
    Repo -->|auto deploy| VercelProd
    Repo -->|CI checks| Actions
    VercelProd --> GIP2
    VercelProd --> Pooler
    Pooler --> PGProd
    VercelProd --> GCS2
    VercelProd --> CRJobs
    VercelProd --> ThirdParty
    CRJobs --> GCS2
```

### Deployment Configuration

| Environment | Database | DB Driver | Max Connections | Idle Timeout |
|---|---|---|---|---|
| Local Development | PGlite (in-memory) | `@electric-sql/pglite` | N/A | N/A |
| Production | Neon PostgreSQL | `pg` via Drizzle | 10 | 30s |
| Cloud Run Jobs | Neon PostgreSQL | `pg` via Drizzle | 5 | 30s |

---

## Technology Decisions

| Category | Choice | Why |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Server components, API routes, edge runtime, Vercel-optimized deployment |
| **Language** | TypeScript (strict) | Type safety across full stack, shared types between client and server |
| **Styling** | Tailwind CSS 4 | Utility-first, fast iteration, zero-runtime CSS, excellent DX |
| **UI Library** | React 19 + React Compiler | Automatic memoization, improved performance, concurrent features |
| **ORM** | DrizzleORM | Type-safe SQL, lightweight, excellent PostgreSQL support, migration tooling |
| **Database** | Neon (Serverless PostgreSQL) | Serverless scaling, branching, connection pooling, HIPAA-eligible |
| **Local DB** | PGlite | Zero-config PostgreSQL in-process, identical SQL for dev/prod parity |
| **Auth** | Google Identity Platform | HIPAA-eligible, MFA, social auth, Firebase SDK compatibility |
| **Hosting** | Vercel | Automatic deployments, edge CDN, serverless functions, enterprise support |
| **Storage** | Google Cloud Storage | Presigned URLs, fine-grained IAM, regional buckets, HIPAA-eligible |
| **Video Processing** | Google Cloud Run Jobs | Scale-to-zero, GPU support, containerized FFmpeg, cost-efficient |
| **Email** | Paubox | HIPAA-compliant encrypted email, required for PHI communication |
| **Transcription** | Deepgram (Nova-2) | Best-in-class accuracy, speaker diarization, real-time support |
| **Text AI** | OpenAI + Gemini | Multi-provider resilience, GPT-4o for analysis, Gemini for cost optimization |
| **Image AI** | Vertex AI + Stability AI + Atlas Cloud | Imagen 3 quality, multi-provider fallback, image-to-image support |
| **Video AI** | Fal AI + Atlas Cloud | Fast generation, image-to-video, text-to-video |
| **Music AI** | Suno AI (V4.5/V5) | Custom therapeutic music, instrumental mode, vocal gender control |
| **AI Tracing** | Langfuse | Cost tracking per model, prompt versioning, latency monitoring |
| **Security** | Arcjet | Bot detection, WAF (OWASP Top 10), rate limiting, Shield |
| **Forms** | React Hook Form + Zod | Performant forms, schema-driven validation, TypeScript integration |
| **Testing** | Vitest + Playwright | Fast unit tests, real browser E2E, Storybook integration |
| **Linting** | ESLint (Antfu config) | Opinionated defaults, import sorting, formatting integration |
| **Analytics** | PostHog | Privacy-focused, self-hostable, feature flags, session replay |
| **Support** | Intercom | In-app chat, knowledge base, user onboarding |

---

## Connection & Performance Configuration

| Setting | Development | Production | Cloud Run |
|---|---|---|---|
| Database driver | PGlite (in-memory) | `pg` (TCP) | `pg` (TCP) |
| Max connections | N/A | 10 | 5 |
| Idle timeout | N/A | 30s | 30s |
| Auth token expiry | 24 hours | 24 hours | N/A |
| Session timeout | 15 min (configurable) | 15 min (configurable) | N/A |
| Rate limiting | Disabled | Arcjet | N/A |
| HIPAA headers | Yes | Yes | N/A |
| Audit logging | Yes | Yes | N/A |
| AI tracing | Optional | Langfuse | N/A |

---

## Security Architecture

> [!IMPORTANT]
> StoryCare is a HIPAA-compliant platform. All PHI (Protected Health Information) is stored in Neon PostgreSQL with encryption at rest. Firebase Auth user metadata does NOT contain PHI.

### Security Layers

1. **Edge (Vercel Middleware)**: HIPAA security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options), Arcjet WAF Shield
2. **Authentication**: Google Identity Platform with custom database roles, automatic user activation on first login
3. **Authorization**: Role-based access control (RBAC) enforced in API routes via `verifyIdToken()`
4. **Data Protection**: Parameterized queries (DrizzleORM), input validation (Zod), data encryption at rest (Neon)
5. **Audit Trail**: All PHI access logged in `audit_logs` table with IP, user agent, request details
6. **Email**: HIPAA-compliant email via Paubox (NOT SendGrid)
7. **Storage**: Presigned URLs with expiration for GCS media access
8. **Soft Delete**: HIPAA-mandated 90-day retention before permanent deletion

---

## Key Architectural Patterns

### Provider Abstraction

AI providers are abstracted behind unified interfaces in `src/libs/`:

- `TextGeneration.ts` - OpenAI, Gemini providers
- `ImageGeneration.ts` - Vertex AI, Stability AI, Gemini, Atlas Cloud providers
- `VideoGeneration.ts` - Fal AI, Atlas Cloud providers
- `SunoAI.ts` - Suno AI music generation

Providers are implemented in `src/libs/providers/` and can be swapped via environment configuration without changing application code.

### Service Layer

Business logic is encapsulated in `src/services/`, keeping API routes thin. Services handle database queries, external API calls, and complex orchestration (e.g., `WorkflowExecutorService` for building blocks workflows).

### Building Blocks Workflow

The building blocks system provides a visual workflow editor for therapeutic prompts. Blocks are composable units (AI text generation, image generation, conditional logic) that execute sequentially with accumulated context. Execution state is persisted in `workflow_executions` for resumability.

---

*Last updated: 2026-02-19*
