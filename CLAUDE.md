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
  - Supports passwordless authentication, magic links, MFA
  - Social auth: Google, Facebook, Twitter, GitHub, Apple
  - Email/Password, Phone authentication
  - User management via Firebase Admin SDK
  - Session management with JWT tokens (24-hour expiration)
  - HIPAA-compliant with proper BAA (Business Associate Agreement)
- **Implementation**: Firebase JS SDK + Next.js
  - Client-side: Firebase JS SDK (`firebase/auth`)
  - Server-side: Firebase Admin SDK (`firebase-admin/auth`)
  - Environment variables: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, etc.
  - Auth state management with React Context
  - Auth routes located at: `src/app/[locale]/(auth)/`
  - Protected routes use middleware to verify ID tokens

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
- **Language**: English only (no i18n)

### Backend & API
- **API Routes**: Next.js App Router route handlers
- **Database ORM**: DrizzleORM
- **Validation**: Zod schemas
- **Security**: Arcjet (bot detection, WAF, rate limiting)
- **Middleware**: Custom middleware for authentication and security

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
│   ├── (auth)/              # Authenticated routes (Therapist/Admin)
│   │   ├── dashboard/       # Engagement dashboard
│   │   ├── sessions/        # Session library and upload
│   │   ├── assets/          # Patient content library
│   │   ├── scenes/          # Scene editor
│   │   ├── pages/           # Story page builder
│   │   ├── admin/           # Admin panel
│   │   └── layout.tsx       # Auth layout with sidebar
│   ├── (patient)/           # Patient-facing routes
│   │   ├── story/[id]/      # Story page viewer
│   │   └── layout.tsx       # Patient layout
│   ├── api/                 # API routes (StoryCare endpoints)
│   ├── layout.tsx           # Root layout
│   └── global-error.tsx
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
│   ├── FirebaseAdmin.ts    # Firebase Admin SDK
│   ├── GCS.ts              # Google Cloud Storage
│   ├── Deepgram.ts         # Transcription API
│   ├── OpenAI.ts           # AI services (GPT-4, DALL-E)
│   └── Logger.ts           # Logging config
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

**StoryCare Database Schema Overview** (see PRD.md for complete schema):
- `users` - Therapists, patients, admins (with role field)
- `groups` - Therapy groups
- `sessions` - Therapy session records with audio URLs
- `transcripts` - Session transcripts from Deepgram
- `speakers` - Identified speakers in sessions
- `utterances` - Individual speech segments with timestamps
- `media_library` - Generated images, videos, audio
- `quotes` - Extracted meaningful quotes from transcripts
- `scenes` - Assembled video scenes with timeline
- `story_pages` - Patient-facing content pages
- `page_blocks` - Content blocks within story pages
- `reflection_questions` - Questions for patient reflection
- `survey_questions` - Survey questions for patient feedback
- `reflection_responses` - Patient answers to reflections
- `survey_responses` - Patient survey submissions
- `patient_page_interactions` - Engagement tracking

```typescript
import { eq } from 'drizzle-orm';

// Define schema in src/models/Schema.ts
import { pgTable, serial, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
// Use in components/routes
import { db } from '@/libs/DB';
import { users } from '@/models/Schema';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(), // 'therapist', 'patient', 'admin'
  firebaseUid: varchar('firebase_uid', { length: 255 }).unique(),
  therapistId: uuid('therapist_id').references(() => users.id),
  referenceImageUrl: text('reference_image_url'), // For AI generation
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Fetch therapist's patients
const patients = await db
  .select()
  .from(users)
  .where(eq(users.therapistId, therapistId));
```

### API Routes
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
    const user = await verifyIdToken(token);
    const body = await request.json();
    const validated = schema.parse(body);

    // Your logic here with validated data
    // user.uid contains the Firebase user ID

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
```

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

# Google Cloud Storage (for media files)
GCS_PROJECT_ID=...
GCS_CLIENT_EMAIL=...
GCS_PRIVATE_KEY=...
GCS_BUCKET_NAME=...

# Email & SMS Notifications
SENDGRID_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...

# Video Processing (FFmpeg or Cloudinary)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
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
```

## Development Workflow

### Adding a New Feature
1. **Create feature branch**: `git checkout -b feature/your-feature`
2. **Update database schema**: Modify `src/models/Schema.ts` if needed
3. **Generate migration**: `npm run db:generate`
4. **Run migration**: `npm run db:migrate`
5. **Implement feature**: Add components, API routes, etc.
6. **Add tests**: Unit tests (*.test.tsx), E2E tests (*.e2e.ts)
7. **Run quality checks**: `npm run lint && npm run check:types && npm run test`
8. **Commit with conventional commits**: `npm run commit`

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
- Firebase Authentication variables (both client and server)
- `FIREBASE_SERVICE_ACCOUNT_KEY` for Firebase Admin SDK
- `SENTRY_AUTH_TOKEN` for error monitoring
- `ARCJET_KEY` for security
- `DEEPGRAM_API_KEY` for transcription
- `OPENAI_API_KEY` for AI features
- `GCS_*` variables for media storage

### Pre-deployment Checklist
- [ ] All tests passing
- [ ] Type checking clean
- [ ] No linting errors
- [ ] Environment variables configured in Vercel
- [ ] Database migrations ready
- [ ] Firebase project created and configured
- [ ] Firebase Admin SDK credentials set
- [ ] Sentry project created
- [ ] Arcjet configured
- [ ] PostHog analytics set up
- [ ] Deepgram API key configured
- [ ] OpenAI API key configured
- [ ] Google Cloud Storage bucket created
- [ ] Business Associate Agreements (BAA) signed for HIPAA compliance

## Troubleshooting

### Database Connection Issues
- Local: Ensure PGlite server is running (`npm run dev`)
- Production: Verify `DATABASE_URL` in Vercel dashboard
- Check Neon dashboard for connection limits

### Authentication Issues
- Verify Firebase configuration in `.env.local` or Vercel dashboard
- Check Firebase Console for project status and authentication settings
- Ensure Firebase Admin SDK credentials are valid (service account JSON)
- Review middleware configuration in `src/middleware.ts`
- Verify ID token verification logic on API routes
- Check browser console for Firebase SDK errors
- Ensure auth domain is properly configured (`your-project.firebaseapp.com`)
- For production: Verify custom domain is added to Firebase Auth authorized domains

### Build Failures
- Run `npm run build-local` to test locally
- Check TypeScript errors: `npm run check:types`
- Review Sentry for runtime errors

### Performance Issues
- Use Next.js bundle analyzer: `npm run build-stats`
- Check database query performance in Drizzle Studio
- Review PostHog analytics for slow pages
- Consider edge caching strategies

## Firebase Authentication Implementation

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
```typescript
// src/libs/FirebaseAdmin.ts
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

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

// Verify ID token on API routes
export async function verifyIdToken(token: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return { uid: decodedToken.uid, email: decodedToken.email };
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
    const user = await verifyIdToken(token);

    // Your protected logic here
    // User is authenticated, proceed with request
    const body = await request.json();

    // Example: Create a session
    const [newSession] = await db.insert(sessions).values({
      title: body.title,
      sessionDate: body.sessionDate,
      therapistId: user.uid,
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

### HIPAA Compliance with Firebase

**Important Considerations:**
1. **Sign BAA with Google**: Required for HIPAA compliance
   - Available for Firebase projects on Blaze (pay-as-you-go) plan
   - Must be requested through Google Cloud sales

2. **Data Storage**:
   - Do NOT store PHI in Firebase Realtime Database or Firestore
   - Store PHI only in HIPAA-compliant Neon PostgreSQL
   - Firebase Auth user metadata should not contain PHI

3. **Audit Logging**:
   - Log all authentication events (login, logout, password reset)
   - Store audit logs in PostgreSQL, not Firebase
   - Track who accessed what patient data and when

4. **Session Management**:
   - Implement 24-hour token expiration
   - Force re-authentication for sensitive operations
   - Implement automatic logout after inactivity

5. **MFA Requirement**:
   - Require MFA for all therapist accounts in production
   - Configure via Firebase Console under Authentication > Sign-in method

## AI Integration Guidelines

When implementing AI features (Deepgram, OpenAI):

### API Route Pattern
```typescript
import { createClient } from '@deepgram/sdk';
// src/app/api/ai/transcribe/route.ts
import { NextResponse } from 'next/server';
import { verifyIdToken } from '@/libs/FirebaseAdmin';

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
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Arcjet Security](https://docs.arcjet.com/)

### Monitoring & Tools
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Firebase Console](https://console.firebase.google.com/)
- [Sentry Dashboard](https://sentry.io/)
- [PostHog Analytics](https://posthog.com/)
- [Neon Console](https://console.neon.tech/)
- [Google Cloud Console](https://console.cloud.google.com/) (for GCS)

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

### Key Features Implementation Status
Refer to PRD.md for detailed specifications of:
- Session Library & Upload Flow (Screenshots 1-4)
- Transcription & Speaker Diarization (Screenshot 5)
- Transcript Analysis with AI Assistant (Screenshots 6-7)
- Image & Video Generation (Screenshots 8-9)
- Patient Content Library (Screenshots 10-11)
- Scene Editor with Timeline (Screenshot 12)
- Story Page Builder (Screenshots 13-14)
- Dashboard & Analytics (Screenshot 15)

### HIPAA Compliance Checklist
- [ ] Sign Business Associate Agreement (BAA) with all third-party services:
  - [ ] Neon (database)
  - [ ] Google Cloud Platform (storage)
  - [ ] Firebase/Google (authentication)
  - [ ] Deepgram (transcription)
  - [ ] Vercel (hosting)
  - [ ] Sentry (error tracking)
- [ ] Enable audit logging for all PHI access
- [ ] Implement automatic session timeout (24 hours)
- [ ] Enable MFA for all therapist accounts
- [ ] Configure data encryption at rest and in transit
- [ ] Set up 7-year audit log retention
- [ ] Implement patient data export functionality
- [ ] Configure data deletion workflows (90-day soft delete)
- [ ] Document incident response procedures

### Cost Optimization Tips
- Cache Deepgram transcriptions in database to avoid re-processing
- Use GPT-3.5 for simple tasks, GPT-4 for complex analysis
- Implement rate limiting on AI API calls with Arcjet
- Optimize image sizes before uploading to GCS
- Use Next.js Image component for automatic optimization
- Implement edge caching for public story pages
- Monitor PostHog events to track feature usage and costs

---

**Last Updated**: 2025-10-30
**Maintained By**: Development Team
**Product**: StoryCare Digital Therapeutic Platform
**Questions?**: Refer to README.md or PRD.md
