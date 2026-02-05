# StoryCare - Digital Therapeutic Platform

A clinician-guided digital therapeutic platform that uses narrative therapy to help patients visualize and reframe their stories through AI-generated media.

> "We live our lives through stories. These narratives shape identity, behavior, and possibility."

## Quick Links

- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Get up and running in 30 minutes
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup for all services
- **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** - Firebase Authentication setup
- **[DATABASE_GUIDE.md](./DATABASE_GUIDE.md)** - Database schema and migrations
- **[CLAUDE.md](./CLAUDE.md)** - Full project architecture and development guidelines

## Core Features

- **Session Management** - Upload therapy session audio, transcribe with Deepgram
- **Speaker Diarization** - Automatically identify and label speakers in sessions
- **AI-Powered Analysis** - GPT-4 assistant for therapeutic insights and content generation
- **Media Generation** - Create images (Vertex AI Imagen), videos, and music (Suno AI)
- **Story Pages** - Build interactive patient-facing content with reflections and surveys
- **Treatment Modules** - Pre-built therapeutic modules (screeners, outcomes, assessments)
- **Patient Dashboard** - Track engagement and therapeutic outcomes
- **Video Processing** - Cloud Run jobs for video transcoding and assembly
- **HIPAA Compliant** - Audit logging, encryption, and secure data handling

## User Roles

| Role | Description |
|------|-------------|
| **Super Admin** | Platform-wide administrative access |
| **Org Admin** | Manage users within their organization |
| **Therapist** | Primary users - manage sessions, generate media, create story pages |
| **Patient** | View personalized story pages, answer reflections, submit surveys |

## Tech Stack

### Core
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **Database**: DrizzleORM + Neon PostgreSQL (PGlite for local dev)

### Authentication & Storage
- **Auth**: Firebase Authentication (Google Identity Platform)
- **Storage**: Google Cloud Storage
- **Email**: Paubox (HIPAA-compliant)
- **Hosting**: Vercel

### AI Services
- **Transcription**: Deepgram (speech-to-text, speaker diarization)
- **Text Generation**: OpenAI (GPT-4), Google Gemini
- **Image Generation**: Google Vertex AI (Imagen 3)
- **Music Generation**: Suno AI
- **Video Processing**: Google Cloud Run

### Security & Monitoring
- **Security**: Arcjet (WAF, rate limiting, bot protection)
- **Error Tracking**: Sentry
- **Logging**: LogTape
- **Analytics**: PostHog

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials (see GETTING_STARTED.md)

# 3. Run database migrations
npm run db:migrate

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

### Required for Development

```bash
# Firebase Authentication (Client)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK (Server)
FIREBASE_SERVICE_ACCOUNT_KEY=

# Database
DATABASE_URL=

# Security
ARCJET_KEY=

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production Services

```bash
# AI Services
DEEPGRAM_API_KEY=
OPENAI_API_KEY=
VERTEX_API_KEY=
SUNO_API_KEY=

# Google Cloud Storage
GCS_PROJECT_ID=
GCS_CLIENT_EMAIL=
GCS_PRIVATE_KEY=
GCS_BUCKET_NAME=

# HIPAA-Compliant Email
PAUBOX_API_KEY=
PAUBOX_API_USER=
```

## Common Commands

### Development
```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Run production build
```

### Database
```bash
npm run db:generate      # Generate migrations from Schema.ts
npm run db:migrate       # Run migrations
npm run db:studio        # Open Drizzle Studio (browser GUI)
npm run db:push          # Push schema changes (dev only)
```

### Testing
```bash
npm run test             # Unit tests (Vitest)
npm run test:e2e         # E2E tests (Playwright)
npm run storybook        # Start Storybook
```

### Code Quality
```bash
npm run lint             # Check linting
npm run lint:fix         # Fix linting issues
npm run check:types      # Type checking
npm run check:deps       # Check unused dependencies
```

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── (auth)/          # Authenticated routes
│   │   ├── dashboard/   # Engagement dashboard
│   │   ├── sessions/    # Session library
│   │   ├── assets/      # Media library
│   │   ├── scenes/      # Video editor
│   │   ├── pages/       # Story page builder
│   │   ├── patients/    # Patient management
│   │   └── admin/       # Admin panels
│   ├── api/             # API routes
│   └── share/           # Public share pages
├── components/          # React components
├── libs/                # Third-party configs
├── models/              # Database schemas (Schema.ts)
├── services/            # Business logic
├── utils/               # Utilities
└── validations/         # Zod schemas
```

## HIPAA Compliance

StoryCare is designed for HIPAA compliance:

- **Audit Logging** - All PHI access logged in `audit_logs` table
- **Encryption** - Data encrypted at rest and in transit
- **Session Management** - 24-hour token expiration
- **Access Control** - Role-based permissions with organization boundaries
- **Email** - HIPAA-compliant email via Paubox (not SendGrid)
- **BAA Required** - Sign Business Associate Agreements with all third-party services

## Database Schema

All database tables are defined in `src/models/Schema.ts`. Key tables include:

- `users` - All user types (therapists, patients, admins)
- `organizations` - Multi-tenant organization support
- `sessions` - Therapy session records
- `transcripts` / `utterances` - Session transcriptions
- `media_library` - Generated images, videos, audio
- `story_pages` / `page_blocks` - Patient-facing content
- `treatment_modules` - Therapeutic modules
- `audit_logs` - HIPAA audit trail

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and add tests
3. Run quality checks: `npm run lint && npm run check:types && npm run test`
4. Commit using conventional commits format
5. Open a pull request

## License

Proprietary - All rights reserved
