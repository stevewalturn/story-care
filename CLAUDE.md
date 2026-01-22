# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# Claude AI Assistant Guide

This document provides guidance for AI assistants (like Claude) working on this Next.js project. It outlines the project architecture, tech stack, key patterns, and best practices to follow.

## Project Overview

**StoryCare** is a digital therapeutic platform that uses narrative therapy to help patients visualize and reframe their stories through AI-generated media. It's a clinician-guided system built on a production-ready Next.js 16+ stack with App Router, TypeScript, Tailwind CSS 4, and comprehensive tooling for authentication, database management, testing, monitoring, and security.

### Core Functionality
- **Session Management**: Upload therapy session audio, transcribe with Deepgram
- **Speaker Diarization**: Automatically identify and label speakers
- **AI-Powered Analysis**: GPT-4 assistant for therapeutic insights
- **Media Generation**: Create images (Vertex AI Imagen), videos, and music (Suno AI)
- **Story Pages**: Build interactive patient-facing content with reflections and surveys
- **Dashboard**: Track patient engagement and therapeutic outcomes
- **Treatment Modules**: Pre-built therapeutic modules and templates
- **Video Processing**: Cloud Run jobs for video transcoding and assembly

### Key Principle
"We live our lives through stories. These narratives shape identity, behavior, and possibility."

## Tech Stack & Infrastructure

### Hosting & Deployment
- **Hosting**: Vercel (Enterprise Plan)
  - Automatic deployments from main branch
  - Edge functions support
  - Built-in CDN and caching
  - Environment variable management in Vercel dashboard
- **Container Workloads**: Google Cloud Run (for video processing jobs)
  - Standalone Docker builds
  - Scale-to-zero capability
  - Optimized connection pooling (5 connections dev, 10 production)

### Database & Storage
- **Database**: Neon (Serverless PostgreSQL)
  - Local development: PGlite (in-memory/file-based)
  - Production: Neon PostgreSQL with connection pooling
  - ORM: DrizzleORM (type-safe)
  - Migrations: Drizzle Kit
  - Connection pooling: 5 connections (dev), 10 (production), 30s idle timeout
- **Data Storage**: Google Cloud Storage (GCS)
  - For file uploads, media assets, and blob storage
  - Configure with service account credentials
  - Presigned URLs for secure file access

### Authentication
- **Auth Provider**: Google Identity Platform (upgraded Firebase Auth)
  - Supports passwordless authentication, magic links, MFA
  - Social auth: Google, Facebook, Twitter, GitHub, Apple
  - Email/Password, Phone authentication
  - User management via Firebase Admin SDK
  - Session management with JWT tokens (24-hour expiration)
  - HIPAA-compliant with proper BAA (Business Associate Agreement)
  - Enterprise features: SAML/OIDC SSO, multi-tenancy support, audit logging
- **Implementation**: Firebase JS SDK + Next.js (Identity Platform compatible)
  - Client-side: Firebase JS SDK (`firebase/auth`)
  - Server-side: Firebase Admin SDK (`firebase-admin/auth`)
  - **Custom user role system**: Roles stored in database, NOT Firebase claims
  - `verifyIdToken()` automatically fetches user and role from database
  - Automatic user activation: Invited users auto-activate on first login
  - Environment variables: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, etc.
  - Auth state management with React Context
  - Auth routes located at: `src/app/(auth)/`
  - Protected routes use middleware to verify ID tokens

### AI Services
- **Speech-to-Text**: Deepgram
  - Real-time transcription
  - Pre-recorded audio processing with speaker diarization
- **AI Models**: Multi-provider abstraction layer
  - **Text Generation**: OpenAI (GPT-4, GPT-3.5), Google Gemini
  - **Image Generation**: Google Vertex AI (Imagen 3, Imagen 2)
  - **Music Generation**: Suno AI
  - **Video Processing**: Cloud Run jobs for FFmpeg operations
  - Provider abstraction in `src/libs/providers/`

### Email & Communication
- **Email**: Paubox (HIPAA-compliant email service)
  - NOT SendGrid - Paubox is required for HIPAA compliance
  - Configured in `src/libs/Paubox.ts`
  - Email templates in `src/services/EmailService.ts`

### Cost & Scaling Considerations

When implementing features, consider these scaling targets:
- **1k users**: Baseline costs, optimize for simplicity
- **10k users**: Focus on efficiency, implement caching
- **100k users**: Require architectural optimization, consider:
  - Database connection pooling (already configured)
  - Edge caching strategies
  - API rate limiting (Arcjet)
  - Background job processing (Cloud Run)
  - Monitoring and alerting

## Core Technologies

### Frontend
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS 4
- **UI**: React 19 with React Compiler
- **Forms**: React Hook Form + Zod validation
- **Language**: English only (no i18n despite boilerplate supporting it)

### Backend & API
- **API Routes**: Next.js App Router route handlers
- **Database ORM**: DrizzleORM
- **Validation**: Zod schemas
- **Security**: Arcjet (bot detection, WAF, rate limiting)
- **Middleware**: Custom middleware for authentication and HIPAA security headers

### Testing & Quality
- **Unit Tests**: Vitest + Browser mode
- **E2E Tests**: Playwright
- **Storybook**: UI component development
- **Linting**: ESLint (Antfu config)
- **Formatting**: Prettier
- **Type Checking**: TypeScript strict mode
- **Code Coverage**: Codecov

### Monitoring & Observability
- **Security**: Arcjet Shield WAF
- **Audit Logging**: Custom HIPAA audit trail in `src/services/AuditService.ts`

## StoryCare Application Structure

### User Roles (Enum in Schema.ts)
1. **Super Admin** (`super_admin`)
   - Platform-wide administrative access
   - Manage all organizations
2. **Organization Admin** (`org_admin`)
   - Manage users within their organization
   - Configure organization settings
3. **Therapists** (`therapist`) - Primary Users
   - Upload and manage therapy sessions
   - Analyze transcripts with AI
   - Generate visual media
   - Create story pages for patients
   - Monitor patient engagement
4. **Patients** (`patient`) - Secondary Users
   - View personalized story pages
   - Watch videos and scenes
   - Answer reflection questions
   - Submit survey responses

### Main Navigation Sections
1. **Dashboard** - Engagement metrics, recent responses
2. **Sessions** - Upload, transcribe, manage therapy sessions
3. **Assets** - Patient media library (images, videos, quotes, notes)
4. **Scenes** - Video editor for assembling narrative scenes
5. **Pages** - Story page builder for patients
6. **Admin** - User management, compliance (org-admin)
7. **Super Admin** - Platform-wide management (super_admin)
8. **Therapist Portal** - Therapist-specific views
9. **Patient Portal** - Patient-facing story pages

### UI Design Specifications (Match Screenshots)
- **Color Scheme**:
  - Primary: #4F46E5 (Indigo/Blue)
  - Background: #F9FAFB (Light Gray)
  - Sidebar: White with shadow
  - Accent: Purple gradient (#6366F1 to #8B5CF6)
- **Typography**: Inter font family, 14px base
- **Sidebar**: 240px width, always visible on desktop
- **Components**: Custom design (no external UI library initially)
- **Icons**: 20x20px for navigation, Lucide React
- **Cards**: Rounded-lg (12px), subtle shadows, hover effects

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authenticated routes (Therapist/Admin)
│   │   ├── dashboard/       # Engagement dashboard
│   │   ├── sessions/        # Session library and upload
│   │   ├── assets/          # Patient content library
│   │   ├── scenes/          # Scene editor
│   │   ├── pages/           # Story page builder
│   │   ├── admin/           # Admin panel (org-admin)
│   │   ├── org-admin/       # Organization admin panel
│   │   ├── super-admin/     # Super admin panel
│   │   ├── therapist/       # Therapist portal
│   │   ├── patient/         # Patient portal
│   │   └── layout.tsx       # Auth layout with sidebar
│   ├── api/                 # API routes (34+ subdirectories)
│   │   ├── sessions/        # Session management
│   │   ├── patients/        # Patient management
│   │   ├── organizations/   # Organization management
│   │   ├── auth/            # Authentication endpoints
│   │   ├── ai/              # AI service endpoints
│   │   ├── media/           # Media generation
│   │   ├── templates/       # Template management
│   │   └── ...
│   ├── sign-in/             # Public sign-in page
│   ├── sign-up/             # Public sign-up page
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Landing page
│   └── global-error.tsx     # Global error boundary
├── components/              # React components
│   ├── layout/             # Sidebar, TopBar, UserMenu
│   ├── sessions/           # SessionCard, UploadModal, SpeakerLabeling
│   ├── transcript/         # TranscriptView, AIAssistant, AnalyzeModal
│   ├── media/              # MediaGrid, GenerateImage, GenerateVideo
│   ├── scenes/             # SceneEditor, Timeline, ClipLibrary
│   ├── pages/              # PageEditor, ContentBlock, MobilePreview
│   ├── dashboard/          # MetricCard, ResponseTable, EngagementList
│   ├── patients/           # PatientModal, PatientCard
│   ├── chat/               # AI chat components
│   ├── ui/                 # Button, Input, Modal, Card, Dropdown
│   └── analytics/          # Analytics providers
├── libs/                    # Third-party configs (singleton instances)
│   ├── Arcjet.ts           # Security config
│   ├── DB.ts               # Database client (singleton)
│   ├── Env.ts              # Environment validation (T3 Env)
│   ├── Firebase.ts         # Firebase Auth config (client)
│   ├── FirebaseAdmin.ts    # Firebase Admin SDK (server)
│   ├── GCS.ts              # Google Cloud Storage
│   ├── Deepgram.ts         # Transcription API
│   ├── OpenAI.ts           # OpenAI client
│   ├── TextGeneration.ts   # Text generation abstraction
│   ├── ImageGeneration.ts  # Image generation abstraction
│   ├── VideoGeneration.ts  # Video generation abstraction
│   ├── Paubox.ts           # HIPAA-compliant email
│   ├── Logger.ts           # Logging config (LogTape)
│   ├── AuditLogger.ts      # HIPAA audit logging
│   └── providers/          # AI provider implementations
│       ├── OpenAIProvider.ts
│       ├── GeminiProvider.ts
│       └── VertexProvider.ts
├── models/                  # Database schemas (DrizzleORM)
│   └── Schema.ts           # All tables in ONE file (58KB, 25+ enums)
│                           # Tables: users, organizations, sessions, transcripts,
│                           # speakers, utterances, media_library, scenes,
│                           # story_pages, page_blocks, treatment_modules,
│                           # session_modules, templates, chat_messages,
│                           # video_processing_jobs, reflection_responses,
│                           # survey_responses, audit_logs, etc.
├── services/                # Business logic services (18+ services)
│   ├── SessionService.ts   # Session/module management
│   ├── MediaService.ts     # Media generation
│   ├── SceneService.ts     # Video assembly
│   ├── VideoService.ts     # Video processing
│   ├── VideoTranscodingService.ts # Video transcoding jobs
│   ├── WorkflowExecutorService.ts # Complex workflow execution
│   ├── StoryPageGeneratorService.ts # Story page generation
│   ├── EmailService.ts     # Email templates and sending
│   ├── AuditService.ts     # HIPAA audit logging
│   ├── ModuleService.ts    # Treatment modules
│   └── AnalyticsService.ts # Engagement calculations
├── styles/                  # Global styles
│   └── global.css          # Tailwind CSS + custom variables
├── types/                   # TypeScript types
│   ├── JSONSchemas.ts      # Complex JSON schemas (25KB)
│   ├── BuildingBlocks.ts   # Content block types
│   ├── Organization.ts     # Org-related types
│   └── Paubox.ts           # Email service types
├── utils/                   # Utility functions (18+ utilities)
│   ├── AppConfig.ts        # App configuration
│   ├── DBConnection.ts     # DB connection pooling
│   ├── AuthHelpers.ts      # Firebase auth utilities
│   ├── Encryption.ts       # Data encryption/decryption
│   ├── GCSUtils.ts         # GCS path and presigned URL utilities
│   ├── BlockSchemaGenerator.ts # Dynamic schema generation
│   ├── PromptJSONValidator.ts # JSON validation for AI prompts
│   ├── RateLimiter.ts      # Rate limiting implementation
│   ├── SceneHelpers.ts     # Scene utilities
│   ├── SunoAudioUtils.ts   # Music generation utilities
│   ├── TemplateInterpolation.ts # Template variable replacement
│   └── Helpers.ts          # General helpers
├── validations/             # Zod schemas for input validation
│   ├── AuthValidation.ts
│   ├── UserValidation.ts
│   ├── OrganizationValidation.ts
│   ├── SessionValidation.ts
│   ├── MediaValidation.ts
│   ├── PageValidation.ts
│   ├── TemplateValidation.ts
│   └── ModuleValidation.ts
├── hooks/                   # Custom React hooks
│   ├── useBuildingBlocks.ts # Building block management
│   └── useVideoJobPolling.ts # Video job status polling
├── contexts/                # React Context providers
├── config/                  # Configuration files
├── constants/               # Application constants
└── middleware.ts            # Auth & security middleware (HIPAA headers)

migrations/                  # Database migrations (20+ migrations)
scripts/                     # Seed scripts and utilities
├── seed-superadmin.mjs     # Create super admin user
├── seed-treatment-modules.ts # Seed treatment modules
├── seed-templates.ts       # Seed page templates
└── seed-system-prompts.ts  # Seed AI system prompts

tests/
├── e2e/                    # E2E tests (*.e2e.ts)
└── integration/            # Integration tests (*.spec.ts)
```

## Key Patterns & Conventions

### File Naming
- Components: PascalCase (e.g., `SessionCard.tsx`)
- Utilities/Services/Libs: PascalCase (e.g., `AuthHelpers.ts`)
- Tests: `*.test.tsx` (unit), `*.spec.ts` (integration), `*.e2e.ts` (E2E)
- Stories: `*.stories.tsx`

### Code Organization
- Keep components small and focused
- Use Server Components by default
- Mark Client Components with `'use client'`
- Co-locate tests with source files when appropriate
- Use absolute imports with `@` prefix (`@/libs/DB`, `@/components/ui/Button`)
- Single `Schema.ts` file for all database tables
- Business logic in `/services`, not in API routes or components

### Database Operations

**CRITICAL: All database schema is in ONE file: `src/models/Schema.ts` (58KB)**

**StoryCare Database Schema Overview**:
- `users` - Therapists, patients, admins (role enum: super_admin, org_admin, therapist, patient)
- `organizations` - Multi-tenant organization support
- `sessions` - Therapy session records with audio URLs
- `transcripts` - Session transcripts from Deepgram
- `speakers` - Identified speakers in sessions
- `utterances` - Individual speech segments with timestamps
- `media_library` - Generated images, videos, audio
- `quotes` - Extracted meaningful quotes from transcripts
- `scenes` - Assembled video scenes with timeline
- `story_pages` - Patient-facing content pages
- `page_blocks` - Content blocks within story pages
- `treatment_modules` - Therapeutic modules (screeners, outcomes, etc.)
- `session_modules` - Module assignments to sessions
- `templates` - Reusable content templates
- `chat_messages` - Conversation history with AI
- `video_processing_jobs` - Async video job tracking
- `reflection_questions` - Questions for patient reflection
- `survey_questions` - Survey questions for patient feedback
- `reflection_responses` - Patient answers to reflections
- `survey_responses` - Patient survey submissions
- `patient_page_interactions` - Engagement tracking
- `audit_logs` - HIPAA audit trail

**Connection Pooling Configuration**:
- Max connections: 5 (development), 10 (production)
- Idle timeout: 30 seconds (for Cloud Run scale-to-zero)
- Configured in `src/utils/DBConnection.ts`

```typescript
import { eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { users } from '@/models/Schema';

// Fetch therapist's patients
const patients = await db
  .select()
  .from(users)
  .where(eq(users.therapistId, therapistId));
```

### API Routes
**CRITICAL: Authentication uses Firebase Admin + custom database role fetching**

```typescript
// src/app/api/sessions/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyIdToken } from '@/libs/FirebaseAdmin';

const schema = z.object({
  title: z.string(),
  sessionDate: z.string(),
  sessionType: z.enum(['individual', 'group']),
});

export async function POST(request: Request) {
  // Verify authentication
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.substring(7);

  try {
    // IMPORTANT: verifyIdToken() fetches user + role from database
    const user = await verifyIdToken(token);
    // user contains: { uid, email, role, organizationId, ... }

    const body = await request.json();
    const validated = schema.parse(body);

    // Your logic here with validated data
    // user.uid contains the Firebase user ID
    // user.role contains the user's role from the database

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
```

### Service Layer Pattern
- Business logic separated from API routes
- Database queries encapsulated in services
- Services return strongly-typed data
- Example: `SessionService.ts`, `MediaService.ts`, `EmailService.ts`
- Services in `/src/services/` directory

### AI Provider Abstraction
- Multi-provider support for text, image, and music generation
- Provider implementations in `/src/libs/providers/`
- Easy to swap providers without changing application code
- Configuration via environment variables

## Environment Variables

### Required for Development
```bash
# Firebase Authentication (Client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (Server-side)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
# Or separate fields:
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@...iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Database (PGlite for local, Neon for production)
DATABASE_URL=postgresql://...

# Security
ARCJET_KEY=ajkey_...

# StoryCare App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=StoryCare
```

### Production Only
```bash
# AI Services
DEEPGRAM_API_KEY=...
OPENAI_API_KEY=...

# Image Generation
VERTEX_API_KEY=...              # Google Vertex AI (Imagen 3, Imagen 2)

# Music Generation
SUNO_API_KEY=...                # Suno AI for music generation

# Google Cloud Storage (for media files)
GCS_PROJECT_ID=...
GCS_CLIENT_EMAIL=...
GCS_PRIVATE_KEY=...
GCS_BUCKET_NAME=...

# Email (HIPAA-compliant)
PAUBOX_API_KEY=...
PAUBOX_API_USER=...

# Video Processing
CLOUDINARY_CLOUD_NAME=...       # (Optional alternative to Cloud Run)
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Google Cloud Run (for video jobs)
GOOGLE_CLOUD_PROJECT=...
GOOGLE_CLOUD_REGION=...
```

## Common Commands

### Development
```bash
npm run dev              # Start dev server with PGlite
npm run build            # Production build (runs migrations first)
npm run start            # Run production build
npm run build-local      # Build with in-memory DB (for testing)
```

### Database
```bash
npm run db:generate      # Generate migrations from Schema.ts
npm run db:migrate       # Run migrations
npm run db:studio        # Open Drizzle Studio (browser GUI)
npm run db:push          # Push schema changes without migrations (dev only)
```

### Database Seeding
```bash
npm run db:seed-superadmin    # Create initial super admin user
npm run db:seed-modules       # Seed treatment modules
npm run db:seed-templates     # Seed page templates
npm run db:seed-prompts       # Seed AI system prompts
```

### Testing
```bash
npm run test             # Unit tests (Vitest)
npm run test:e2e         # E2E tests (Playwright)
npm run storybook        # Start Storybook
npm run storybook:test   # Run Storybook tests
```

### Code Quality
```bash
npm run lint             # Check linting
npm run lint:fix         # Fix linting issues
npm run check:types      # Type checking
npm run check:deps       # Unused dependencies (Knip)
```

### Build Analysis
```bash
npm run build-stats      # Bundle analyzer (ANALYZE=true)
```

## Development Workflow

### Adding a New Feature
1. **Create feature branch**: `git checkout -b feature/your-feature`
2. **Update database schema**: Modify `src/models/Schema.ts` if needed
3. **Generate migration**: `npm run db:generate`
4. **Run migration**: `npm run db:migrate`
5. **Implement feature**: Add components, API routes, services, etc.
6. **Add tests**: Unit tests (*.test.tsx), E2E tests (*.e2e.ts)
7. **Run quality checks**: `npm run lint && npm run check:types && npm run test`
8. **Commit with conventional commits**: Standard git commit

### Database Schema Changes
```bash
# 1. Modify src/models/Schema.ts (ALL tables are in this ONE file)
# 2. Generate migration
npm run db:generate

# 3. Review migration in migrations/ directory
# 4. Apply migration
npm run db:migrate

# 5. No need to restart dev server
```

### Committing Changes
Use conventional commits format:
```bash
# Manually:
# feat: add user profile page
# fix: resolve authentication bug
# docs: update API documentation
# chore: update dependencies
```

## Security Considerations

### Arcjet Configuration
Located in `src/libs/Arcjet.ts`:
- Bot detection (allow search engines, block scrapers)
- Rate limiting on API routes
- Shield WAF for OWASP Top 10 protection
- Custom rules in `middleware.ts`

### Authentication Best Practices
- Never store sensitive keys in `.env` (use `.env.local`)
- Use environment variables for all secrets
- **Custom role system**: Roles stored in database, fetched by `verifyIdToken()`
- Automatic user activation for invited users on first login
- Enable MFA for production accounts
- Use Firebase Admin SDK on server side for secure operations
- Verify ID tokens on API routes before processing requests

### HIPAA Security Headers (in middleware.ts)
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options (prevent clickjacking)
- X-Content-Type-Options (prevent MIME sniffing)
- Audit logging for all PHI access

### Data Protection
- Validate all inputs with Zod schemas
- Sanitize user-generated content
- Use parameterized queries (DrizzleORM handles this)
- Implement proper CORS policies
- Rate limit API endpoints with Arcjet
- **HIPAA audit logging**: All PHI access logged in `audit_logs` table

## Testing Strategy

### Unit Tests (Vitest)
- Test individual functions and components
- Mock external dependencies
- Co-locate with source files (*.test.tsx)
- Two projects: `unit` (Node env) and `ui` (browser env with Playwright)

### Integration Tests (Playwright)
- Test API endpoints
- Test database operations
- Located in `tests/integration/` (*.spec.ts)

### E2E Tests (Playwright)
- Test full user flows
- Test across browsers (Chromium + Firefox on CI)
- Located in `tests/e2e/` (*.e2e.ts)
- Used by Checkly for monitoring
- Timeouts: 60s (local), 30s (CI)

### Visual Regression
- Automated screenshot comparison
- Catches unintended UI changes

## Deployment

### Vercel Deployment
1. Push to main branch
2. Automatic build and deploy
3. Environment variables set in Vercel dashboard
4. Database migrations run during build
5. Standalone Docker output for Cloud Run compatibility

### Required Environment Variables in Vercel
- `DATABASE_URL` pointing to Neon PostgreSQL
- Google Identity Platform variables (both client and server)
- `FIREBASE_SERVICE_ACCOUNT_KEY` for Firebase Admin SDK
- `ARCJET_KEY` for security
- `DEEPGRAM_API_KEY` for transcription
- `OPENAI_API_KEY` for AI features
- `VERTEX_API_KEY` for image generation
- `GCS_*` variables for media storage
- `PAUBOX_*` variables for HIPAA-compliant email

### Pre-deployment Checklist
- [ ] All tests passing
- [ ] Type checking clean
- [ ] No linting errors
- [ ] Environment variables configured in Vercel
- [ ] Database migrations ready
- [ ] Google Identity Platform project created and configured
- [ ] Firebase Admin SDK credentials set
- [ ] Arcjet configured
- [ ] Deepgram API key configured
- [ ] OpenAI API key configured
- [ ] Vertex AI API key configured
- [ ] Google Cloud Storage bucket created
- [ ] Paubox account created for HIPAA-compliant email
- [ ] Business Associate Agreements (BAA) signed for HIPAA compliance

## Troubleshooting

### Database Connection Issues
- Local: Ensure PGlite server is running (`npm run dev`)
- Production: Verify `DATABASE_URL` in Vercel dashboard
- Check Neon dashboard for connection limits
- Connection pooling: Max 5 (dev), 10 (prod), 30s idle timeout

### Authentication Issues
- Verify Identity Platform configuration in `.env.local` or Vercel dashboard
- Check Google Cloud Console → Identity Platform for project status
- Ensure Firebase Admin SDK credentials are valid (service account JSON)
- Review middleware configuration in `src/middleware.ts`
- **Custom roles**: Verify user role is correctly set in database
- Check `verifyIdToken()` logic in `src/libs/FirebaseAdmin.ts`
- Verify automatic user activation is working for invited users
- Check browser console for Firebase SDK errors
- Ensure auth domain is properly configured (`your-project.firebaseapp.com`)
- For production: Verify custom domain is added to Identity Platform authorized domains

### Build Failures
- Run `npm run build-local` to test locally
- Check TypeScript errors: `npm run check:types`
- Verify all environment variables are set

### Performance Issues
- Use Next.js bundle analyzer: `npm run build-stats`
- Check database query performance in Drizzle Studio
- Consider edge caching strategies
- Monitor connection pool usage

## Google Identity Platform Implementation

### Client-Side Authentication (Browser)
```typescript
// src/libs/Firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

### Server-Side Authentication (API Routes)
**CRITICAL: Custom implementation that fetches user role from database**

```typescript
// src/libs/FirebaseAdmin.ts
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { db } from '@/libs/DB';
import { users } from '@/models/Schema';
import { eq } from 'drizzle-orm';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminAuth = getAuth();

// Verify ID token AND fetch user role from database
export async function verifyIdToken(token: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Fetch user from database to get role
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid));

    if (!user) {
      throw new Error('User not found');
    }

    // Automatic activation for invited users on first login
    if (user.status === 'invited') {
      await db
        .update(users)
        .set({ status: 'active' })
        .where(eq(users.id, user.id));
    }

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: user.role, // Custom role from database
      organizationId: user.organizationId,
      userId: user.id,
    };
  } catch (error) {
    throw new Error('Unauthorized');
  }
}
```

### Protected API Route Pattern
```typescript
// src/app/api/sessions/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { verifyIdToken } from '@/libs/FirebaseAdmin';
import { sessions } from '@/models/Schema';

export async function POST(request: Request) {
  // Get token from Authorization header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.substring(7);

  try {
    // IMPORTANT: This fetches user + role from database
    const user = await verifyIdToken(token);

    // User object contains:
    // - uid: Firebase UID
    // - email: User email
    // - role: Database role (super_admin, org_admin, therapist, patient)
    // - organizationId: User's organization ID
    // - userId: Database user ID

    // Your protected logic here
    const body = await request.json();

    // Example: Create a session
    const [newSession] = await db.insert(sessions).values({
      title: body.title,
      sessionDate: body.sessionDate,
      therapistId: user.userId, // Use database user ID, not Firebase UID
      organizationId: user.organizationId,
      // ... other fields
    }).returning();

    return NextResponse.json({ session: newSession });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

### Auth Context Provider
```typescript
// src/components/providers/AuthProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/libs/Firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  idToken: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  idToken: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [idToken, setIdToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const token = await user.getIdToken();
        setIdToken(token);
      } else {
        setIdToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, idToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### HIPAA Compliance with Identity Platform

**Important Considerations:**
1. **Sign BAA with Google**: Required for HIPAA compliance
   - Identity Platform is HIPAA-eligible with signed BAA
   - Must be requested through Google Cloud sales

2. **Data Storage**:
   - Do NOT store PHI in Firebase Realtime Database or Firestore
   - Store PHI only in HIPAA-compliant Neon PostgreSQL
   - Firebase Auth user metadata should not contain PHI

3. **Audit Logging**:
   - Log all authentication events (login, logout, password reset)
   - Store audit logs in PostgreSQL `audit_logs` table, not Firebase
   - Track who accessed what patient data and when
   - Service: `src/services/AuditService.ts`

4. **Session Management**:
   - Implement 24-hour token expiration
   - Force re-authentication for sensitive operations
   - Implement automatic logout after inactivity

5. **MFA Requirement**:
   - Require MFA for all therapist accounts in production
   - Configure via Firebase Console under Authentication > Sign-in method

## AI Integration Guidelines

When implementing AI features (Deepgram, OpenAI, etc.):

### Multi-Provider Abstraction Pattern
```typescript
// Use abstraction layers in src/libs/
import { generateText } from '@/libs/TextGeneration';
import { generateImage } from '@/libs/ImageGeneration';

// Text generation (supports OpenAI, Gemini)
const result = await generateText({
  provider: 'openai', // or 'gemini'
  model: 'gpt-4',
  prompt: 'Your prompt here',
});

// Image generation (Vertex AI)
const imageUrl = await generateImage({
  provider: 'vertex',
  prompt: 'Your image prompt',
  model: 'imagen-3',
});
```

### API Route Pattern
```typescript
// src/app/api/ai/transcribe/route.ts
import { NextResponse } from 'next/server';
import { verifyIdToken } from '@/libs/FirebaseAdmin';
import { createClient } from '@deepgram/sdk';

export async function POST(request: Request) {
  // Verify authentication
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.substring(7);

  try {
    const user = await verifyIdToken(token);
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);
    const { audioUrl } = await request.json();

    // Process with Deepgram
    const result = await deepgram.listen.prerecorded.transcribeUrl(
      { url: audioUrl },
      { model: 'nova-2', smart_format: true, diarize: true }
    );

    // Store result in database to avoid re-processing
    // await db.insert(transcripts).values({ ... });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Transcription failed' },
      { status: 500 }
    );
  }
}
```

### Cost Optimization
- Implement caching for repeated requests
- Use rate limiting with Arcjet
- Store results in database to avoid re-processing (transcripts, media)
- Consider tiered models (GPT-3.5 vs GPT-4)

### Error Handling
- Wrap AI calls in try-catch
- Implement retry logic for transient failures
- Provide meaningful error messages to users

## Resources & Documentation

### Official Docs
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [DrizzleORM](https://orm.drizzle.team/docs/overview)
- [Google Identity Platform](https://cloud.google.com/identity-platform/docs)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Arcjet Security](https://docs.arcjet.com/)

### Monitoring & Tools
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Google Cloud Console](https://console.cloud.google.com/) (Identity Platform, GCS, Cloud Run)
- [Neon Console](https://console.neon.tech/)

### AI Services
- [Deepgram Docs](https://developers.deepgram.com/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Google Vertex AI](https://cloud.google.com/vertex-ai/docs)
- [Suno AI Docs](https://suno.ai/docs)

## Code Style & Best Practices

### TypeScript
- Use strict mode (already enabled)
- Prefer `interface` for object shapes
- Use `type` for unions and complex types
- Avoid `any`, use `unknown` if necessary

### React
- Prefer Server Components (default)
- Use Client Components only when needed (`'use client'`)
- Implement proper loading states
- Handle errors with error boundaries

### Tailwind CSS
- Use utility classes
- Create custom components for repeated patterns
- Leverage dark mode variants (if needed)
- Follow mobile-first approach

### Performance
- Optimize images with Next.js Image component
- Implement code splitting
- Use dynamic imports for heavy components
- Leverage React Suspense for data fetching

## Support & Maintenance

### Regular Tasks
- Update dependencies monthly (automated with Dependabot)
- Review and merge CodeRabbit suggestions
- Review HIPAA audit logs
- Monitor Cloud Run jobs for video processing

### Scaling Considerations
- Monitor database performance (queries, connections)
- Review Vercel analytics for traffic patterns
- Plan for connection pooling at scale (already configured)
- Monitor Cloud Run jobs for video processing

## StoryCare-Specific Implementation Notes

### Application URLs
- **Local Development**: `http://localhost:3000`
- **Production**: TBD (configure in Vercel)
- **App Name**: StoryCare (used in navigation, emails, notifications)

### Language Support
- **English Only**: No internationalization (i18n) or localization
- All UI text, labels, and content are in English
- No `[locale]` routing - direct app routes
- No translation files or next-intl dependency
- Simplifies routing structure: `/dashboard` instead of `/en/dashboard`

### HIPAA Compliance Checklist
- [ ] Sign Business Associate Agreement (BAA) with all third-party services:
  - [ ] Neon (database)
  - [ ] Google Cloud Platform (Identity Platform, GCS, Cloud Run)
  - [ ] Deepgram (transcription)
  - [ ] Vercel (hosting)
  - [ ] Paubox (email)
- [ ] Enable audit logging for all PHI access (already implemented in `audit_logs`)
- [ ] Implement automatic session timeout (24 hours - configured)
- [ ] Enable MFA for all therapist accounts
- [ ] Configure data encryption at rest and in transit
- [ ] Set up 7-year audit log retention
- [ ] Implement patient data export functionality
- [ ] Configure data deletion workflows (90-day soft delete)
- [ ] Document incident response procedures

### Cost Optimization Tips
- Cache Deepgram transcriptions in database to avoid re-processing
- Use GPT-3.5 for simple tasks, GPT-4 for complex analysis
- Implement rate limiting on AI API calls with Arcjet (already configured)
- Optimize image sizes before uploading to GCS
- Use Next.js Image component for automatic optimization
- Implement edge caching for public story pages

### Video Processing with Cloud Run
- Video transcoding jobs run on Google Cloud Run
- Standalone Docker builds for containerization
- Scale-to-zero for cost efficiency
- Connection pooling optimized for Cloud Run (30s idle timeout)
- Job status tracked in `video_processing_jobs` table
- Monitor with `useVideoJobPolling` hook

---

**Last Updated**: 2026-01-22
**Maintained By**: Development Team
**Product**: StoryCare Digital Therapeutic Platform
**Questions?**: Refer to README.md for setup guides
