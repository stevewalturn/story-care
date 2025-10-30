# Claude AI Assistant Guide

This document provides guidance for AI assistants (like Claude) working on this Next.js project. It outlines the project architecture, tech stack, key patterns, and best practices to follow.

## Project Overview

**StoryCare** is a digital therapeutic platform that uses narrative therapy to help patients visualize and reframe their stories through AI-generated media. It's a clinician-guided system built on a production-ready Next.js 16+ stack with App Router, TypeScript, Tailwind CSS 4, and comprehensive tooling for authentication, database management, testing, monitoring, and security.

### Core Functionality
- **Session Management**: Upload therapy session audio, transcribe with Deepgram
- **Speaker Diarization**: Automatically identify and label speakers
- **AI-Powered Analysis**: GPT-4 assistant for therapeutic insights
- **Media Generation**: Create images (DALL-E), videos, and scenes
- **Story Pages**: Build interactive patient-facing content with reflections and surveys
- **Dashboard**: Track patient engagement and therapeutic outcomes

### Key Principle
"We live our lives through stories. These narratives shape identity, behavior, and possibility."

## Tech Stack & Infrastructure

### Hosting & Deployment
- **Hosting**: Vercel (Enterprise Plan)
  - Automatic deployments from main branch
  - Edge functions support
  - Built-in CDN and caching
  - Environment variable management in Vercel dashboard

### Database & Storage
- **Database**: Neon (Serverless PostgreSQL)
  - Local development: PGlite (in-memory/file-based)
  - Production: Neon PostgreSQL
  - ORM: DrizzleORM (type-safe)
  - Migrations: Drizzle Kit
- **Data Storage**: Google Cloud Storage (GCS)
  - For file uploads, media assets, and blob storage
  - Configure with service account credentials

### Authentication
- **Auth Provider**: Firebase Authentication (Google Identity Platform)
  - Most complex component to set up
  - Supports passwordless authentication, magic links, MFA
  - Social auth: Google, Facebook, Twitter, GitHub, Apple
  - Email/Password, Phone authentication
  - User management via Admin SDK
  - Reference: [Essential user management features](https://clerk.com/articles/essential-user-management-features-startups)
- **Implementation**: Firebase JS SDK + Next.js
  - Environment variables: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, etc.
  - Auth routes located at: `src/app/[locale]/(auth)/`

### AI Services
- **Speech-to-Text**: Deepgram
  - Real-time transcription
  - Pre-recorded audio processing
- **AI Models**: OpenAI (and other models as needed)
  - GPT-4, GPT-3.5-turbo
  - Consider alternatives based on use case and cost

### Cost & Scaling Considerations

When implementing features, consider these scaling targets:
- **1k users**: Baseline costs, optimize for simplicity
- **10k users**: Focus on efficiency, implement caching
- **100k users**: Require architectural optimization, consider:
  - Database connection pooling
  - Edge caching strategies
  - API rate limiting
  - Background job processing
  - Monitoring and alerting

## Core Technologies

### Frontend
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS 4
- **UI**: React 19 with React Compiler
- **Forms**: React Hook Form + Zod validation
- **i18n**: next-intl with Crowdin integration

### Backend & API
- **API Routes**: Next.js App Router route handlers
- **Database ORM**: DrizzleORM
- **Validation**: Zod schemas
- **Security**: Arcjet (bot detection, WAF, rate limiting)
- **Middleware**: Custom middleware for security and i18n

### Testing & Quality
- **Unit Tests**: Vitest + Browser mode
- **E2E Tests**: Playwright
- **Storybook**: UI component development
- **Linting**: ESLint (Antfu config)
- **Formatting**: Prettier
- **Type Checking**: TypeScript strict mode
- **Code Coverage**: Codecov

### Monitoring & Observability
- **Error Tracking**: Sentry (with Spotlight for local dev)
- **Logging**: LogTape + Better Stack
- **Analytics**: PostHog
- **Monitoring**: Checkly (synthetic monitoring)
- **Security**: Arcjet Shield WAF

## StoryCare Application Structure

### User Roles
1. **Therapists** (Primary Users)
   - Upload and manage therapy sessions
   - Analyze transcripts with AI
   - Generate visual media
   - Create story pages for patients
   - Monitor patient engagement

2. **Patients** (Secondary Users)
   - View personalized story pages
   - Watch videos and scenes
   - Answer reflection questions
   - Submit survey responses

3. **Admins** (Tertiary Users)
   - Manage users and permissions
   - View aggregate analytics
   - Ensure compliance

### Main Navigation Sections
1. **Dashboard** - Engagement metrics, recent responses
2. **Sessions** - Upload, transcribe, manage therapy sessions
3. **Assets** - Patient media library (images, videos, quotes, notes)
4. **Scenes** - Video editor for assembling narrative scenes
5. **Pages** - Story page builder for patients
6. **Admin** - User management, compliance

### UI Design Specifications (Match Screenshots)
- **Color Scheme**:
  - Primary: #4F46E5 (Indigo/Blue)
  - Background: #F9FAFB (Light Gray)
  - Sidebar: White with shadow
  - Accent: Purple gradient (#6366F1 to #8B5CF6)
- **Typography**: Inter font family, 14px base
- **Sidebar**: 240px width, always visible on desktop
- **Components**: Custom design (no external UI library initially)
- **Icons**: 20x20px for navigation, Lucide or Heroicons
- **Cards**: Rounded-lg (12px), subtle shadows, hover effects

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   └── [locale]/            # i18n routing
│       ├── (auth)/          # Authenticated routes (Therapist/Admin)
│       │   ├── dashboard/   # Engagement dashboard
│       │   ├── sessions/    # Session library and upload
│       │   ├── assets/      # Patient content library
│       │   ├── scenes/      # Scene editor
│       │   ├── pages/       # Story page builder
│       │   ├── admin/       # Admin panel
│       │   └── layout.tsx   # Auth layout with sidebar
│       ├── (patient)/       # Patient-facing routes
│       │   ├── story/[id]/  # Story page viewer
│       │   └── layout.tsx   # Patient layout
│       ├── api/             # API routes (StoryCare endpoints)
│       ├── layout.tsx       # Root layout
│       └── global-error.tsx
├── components/              # React components
│   ├── layout/             # Sidebar, TopBar, UserMenu
│   ├── sessions/           # SessionCard, UploadModal, SpeakerLabeling
│   ├── transcript/         # TranscriptView, AIAssistant, AnalyzeModal
│   ├── media/              # MediaGrid, GenerateImage, GenerateVideo
│   ├── scenes/             # SceneEditor, Timeline, ClipLibrary
│   ├── pages/              # PageEditor, ContentBlock, MobilePreview
│   ├── dashboard/          # MetricCard, ResponseTable, EngagementList
│   ├── ui/                 # Button, Input, Modal, Card, Dropdown
│   └── analytics/          # Analytics providers
├── libs/                    # Third-party configs
│   ├── Arcjet.ts           # Security config
│   ├── DB.ts               # Database client
│   ├── Env.ts              # Environment validation
│   ├── Firebase.ts         # Firebase Auth config
│   ├── GCS.ts              # Google Cloud Storage
│   ├── Deepgram.ts         # Transcription API
│   ├── OpenAI.ts           # AI services (GPT-4, DALL-E)
│   └── Logger.ts           # Logging config
├── locales/                 # Translation files
│   ├── en.json
│   └── fr.json
├── models/                  # Database schemas (DrizzleORM)
│   └── Schema.ts           # All tables: users, sessions, transcripts,
│                           # media_library, scenes, story_pages, etc.
├── services/                # Business logic services
│   ├── SessionService.ts   # Session upload, transcription
│   ├── MediaService.ts     # Image/video generation
│   ├── SceneService.ts     # Video assembly
│   └── AnalyticsService.ts # Engagement calculations
├── styles/                  # Global styles
│   └── global.css
├── types/                   # TypeScript types
│   ├── StoryCare.ts        # Domain types
│   └── I18n.ts
├── utils/                   # Utility functions
│   ├── AppConfig.ts        # App configuration
│   ├── DBConnection.ts     # DB utilities
│   └── Helpers.ts
└── validations/             # Zod schemas
    ├── SessionValidation.ts
    ├── MediaValidation.ts
    └── PageValidation.ts

migrations/                  # Database migrations
tests/
├── e2e/                    # E2E tests (*.e2e.ts)
└── integration/            # Integration tests (*.spec.ts)
```

## Key Patterns & Conventions

### File Naming
- Components: PascalCase (e.g., `BaseTemplate.tsx`)
- Utilities: PascalCase (e.g., `Helpers.ts`)
- Tests: `*.test.tsx` (unit), `*.spec.ts` (integration), `*.e2e.ts` (E2E)
- Stories: `*.stories.tsx`

### Code Organization
- Keep components small and focused
- Use Server Components by default
- Mark Client Components with `'use client'`
- Co-locate tests with source files
- Use absolute imports with `@` prefix

### Database Operations
```typescript
// Define schema in src/models/Schema.ts
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Use in components/routes
import { db } from '@/libs/DB';
import { users } from '@/models/Schema';

const userList = await db.select().from(users);
```

### API Routes
```typescript
// src/app/[locale]/api/example/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  name: z.string(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const validated = schema.parse(body);

  // Your logic here

  return NextResponse.json({ success: true });
}
```

### i18n Implementation
```typescript
// Server components
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('HomePage');
  return <h1>{t('title')}</h1>;
}

// Client components
'use client';
import { useTranslations } from 'next-intl';

export default function ClientComponent() {
  const t = useTranslations('HomePage');
  return <h1>{t('title')}</h1>;
}
```

## Environment Variables

### Required for Development
```bash
# Firebase Authentication
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Database (PGlite for local, Neon for production)
DATABASE_URL=postgresql://...

# Security
ARCJET_KEY=ajkey_...
```

### Production Only
```bash
# Sentry Error Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_ORGANIZATION=...
SENTRY_PROJECT=...
SENTRY_AUTH_TOKEN=...

# Logging
NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN=...
NEXT_PUBLIC_BETTER_STACK_INGESTING_HOST=...

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_POSTHOG_HOST=...

# Code Coverage
CODECOV_TOKEN=...

# Monitoring
CHECKLY_API_KEY=...
CHECKLY_ACCOUNT_ID=...

# AI Services
DEEPGRAM_API_KEY=...
OPENAI_API_KEY=...

# Storage
GCS_PROJECT_ID=...
GCS_CLIENT_EMAIL=...
GCS_PRIVATE_KEY=...
GCS_BUCKET_NAME=...
```

## Common Commands

### Development
```bash
npm run dev              # Start dev server with PGlite
npm run build            # Production build
npm run start            # Run production build
npm run build-local      # Build with in-memory DB
```

### Database
```bash
npm run db:generate      # Generate migrations
npm run db:migrate       # Run migrations
npm run db:studio        # Open Drizzle Studio
```

### Testing
```bash
npm run test             # Unit tests
npm run test:e2e         # E2E tests
npm run storybook        # Start Storybook
npm run storybook:test   # Run Storybook tests
```

### Code Quality
```bash
npm run lint             # Check linting
npm run lint:fix         # Fix linting issues
npm run check:types      # Type checking
npm run check:deps       # Unused dependencies
npm run check:i18n       # Translation validation
```

## Development Workflow

### Adding a New Feature
1. **Create feature branch**: `git checkout -b feature/your-feature`
2. **Update database schema**: Modify `src/models/Schema.ts` if needed
3. **Generate migration**: `npm run db:generate`
4. **Run migration**: `npm run db:migrate`
5. **Implement feature**: Add components, API routes, etc.
6. **Add tests**: Unit tests (*.test.tsx), E2E tests (*.e2e.ts)
7. **Update translations**: Add keys to `src/locales/en.json`
8. **Run quality checks**: `npm run lint && npm run check:types && npm run test`
9. **Commit with conventional commits**: `npm run commit`

### Database Schema Changes
```bash
# 1. Modify src/models/Schema.ts
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
npm run commit  # Interactive CLI

# Or manually:
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
- Implement proper RBAC with Firebase Authentication
- Enable MFA for production accounts
- Use Firebase Admin SDK on server side for secure operations
- Verify ID tokens on API routes before processing requests

### Data Protection
- Validate all inputs with Zod schemas
- Sanitize user-generated content
- Use parameterized queries (DrizzleORM handles this)
- Implement proper CORS policies
- Rate limit API endpoints

## Testing Strategy

### Unit Tests (Vitest)
- Test individual functions and components
- Mock external dependencies
- Co-locate with source files (*.test.tsx)

### Integration Tests (Playwright)
- Test API endpoints
- Test database operations
- Located in `tests/integration/` (*.spec.ts)

### E2E Tests (Playwright)
- Test full user flows
- Test across browsers
- Located in `tests/e2e/` (*.e2e.ts)
- Used by Checkly for monitoring

### Visual Regression
- Automated screenshot comparison
- Catches unintended UI changes

## Deployment

### Vercel Deployment
1. Push to main branch
2. Automatic build and deploy
3. Environment variables set in Vercel dashboard
4. Database migrations run during build

### Required Environment Variables in Vercel
- All variables from `.env.production`
- `DATABASE_URL` pointing to Neon PostgreSQL
- `CLERK_SECRET_KEY` for authentication
- `SENTRY_AUTH_TOKEN` for error monitoring
- `ARCJET_KEY` for security

### Pre-deployment Checklist
- [ ] All tests passing
- [ ] Type checking clean
- [ ] No linting errors
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Sentry project created
- [ ] Arcjet configured
- [ ] Analytics set up

## Troubleshooting

### Database Connection Issues
- Local: Ensure PGlite server is running (`npm run dev`)
- Production: Verify `DATABASE_URL` in Vercel dashboard
- Check Neon dashboard for connection limits

### Authentication Issues
- Verify Clerk keys are set correctly
- Check Clerk dashboard for API status
- Review middleware configuration

### Build Failures
- Run `npm run build-local` to test locally
- Check TypeScript errors: `npm run check:types`
- Review Sentry for runtime errors

### Performance Issues
- Use Next.js bundle analyzer: `npm run build-stats`
- Check database query performance in Drizzle Studio
- Review PostHog analytics for slow pages
- Consider edge caching strategies

## AI Integration Guidelines

When implementing AI features (Deepgram, OpenAI):

### API Route Pattern
```typescript
// src/app/[locale]/api/ai/transcribe/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@deepgram/sdk';

export async function POST(request: Request) {
  try {
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);
    const { audioUrl } = await request.json();

    // Process with Deepgram
    const result = await deepgram.listen.prerecorded.transcribeUrl(
      { url: audioUrl },
      { model: 'nova-2', smart_format: true }
    );

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
- Store results in database to avoid re-processing
- Consider tiered models (GPT-3.5 vs GPT-4)
- Monitor usage with PostHog events

### Error Handling
- Wrap AI calls in try-catch
- Log errors to Sentry with context
- Implement retry logic for transient failures
- Provide meaningful error messages to users

## Resources & Documentation

### Official Docs
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [DrizzleORM](https://orm.drizzle.team/docs/overview)
- [Clerk Authentication](https://clerk.com/docs)
- [Arcjet Security](https://docs.arcjet.com/)

### Monitoring & Tools
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Sentry Dashboard](https://sentry.io/)
- [PostHog Analytics](https://posthog.com/)
- [Neon Console](https://console.neon.tech/)

### AI Services
- [Deepgram Docs](https://developers.deepgram.com/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)

## Code Style & Best Practices

### TypeScript
- Use strict mode (already enabled)
- Prefer `interface` for object shapes
- Use `type` for unions and complex types
- Avoid `any`, use `unknown` if necessary

### React
- Prefer Server Components (default)
- Use Client Components only when needed
- Implement proper loading states
- Handle errors with error boundaries

### Tailwind CSS
- Use utility classes
- Create custom components for repeated patterns
- Leverage dark mode variants
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
- Monitor Sentry for new errors
- Check Checkly for uptime issues
- Review PostHog analytics for usage patterns

### Scaling Considerations
- Monitor database performance (queries, connections)
- Track API response times with Better Stack
- Set up alerts for error rates in Sentry
- Review Vercel analytics for traffic patterns
- Plan for connection pooling at scale

---

**Last Updated**: 2025-10-29
**Maintained By**: Development Team
**Questions?**: Refer to README.md or contact the team
