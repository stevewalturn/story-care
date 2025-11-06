# StoryCare - Application Summary

## What is StoryCare?

**StoryCare** is a digital therapeutic platform that uses AI-powered narrative therapy to help mental health patients visualize and reframe their personal stories through interactive multimedia content. The application enables therapists to transform therapy sessions into engaging visual narratives that patients can interact with on their mobile devices.

### Core Mission
"We live our lives through stories. These narratives shape identity, behavior, and possibility."

---

## Who Uses StoryCare?

### 1. Therapists (Primary Users)
- Licensed clinicians conducting narrative therapy
- Upload and transcribe therapy sessions
- Analyze transcripts with AI assistance
- Generate visual media (images, videos)
- Create personalized story pages for patients
- Monitor patient engagement and progress

### 2. Patients (Secondary Users)
- Clients receiving narrative therapy treatment
- View personalized multimedia story pages
- Answer reflection questions
- Complete therapeutic surveys
- Engage with their reframed narratives

### 3. Admins (Tertiary Users)
- Clinical directors and program supervisors
- Manage users and permissions
- Monitor system usage and compliance
- View aggregate analytics

---

## Key Features

### 1. Session Management & Transcription
- **Upload therapy audio recordings** (up to 500MB)
- **Automatic AI transcription** using Deepgram API
- **Speaker diarization** - automatically identify who's speaking
- **Speaker labeling** - tag speakers as Therapist/Patient/Group Member
- **Interactive transcript viewer** with timestamp navigation
- **Audio synchronization** - click any line to jump to that moment

### 2. AI-Powered Therapeutic Analysis
- **GPT-4 Assistant** for analyzing therapy sessions
- **Pre-built therapeutic prompts** for:
  - Therapeutic alliance assessment
  - Theme identification and tracking
  - Progress evaluation
  - Metaphor and symbol suggestions
  - Treatment planning insights
- **Contextual analysis** - select any transcript segment for instant AI insights
- **Chat history** - all AI conversations saved with session context

### 3. Visual Media Generation
- **AI Image Generation** (DALL-E 3)
  - Create symbolic representations of therapeutic themes
  - Use patient reference photos for personalized imagery
  - Generate metaphorical visuals for narrative reframing
- **Video Generation** (planned)
  - Animate images into 5-second clips
  - Add audio narration or music
- **Scene Assembly**
  - Combine multiple clips into cohesive narrative scenes
  - Timeline-based editing
  - Export final therapeutic videos

### 4. Content Library Management
- **Media Library** - organized repository of all generated/uploaded content
- **Quote Extraction** - save meaningful moments from transcripts
- **Clinical Notes** - therapist observations and treatment notes
- **Smart Filtering** - by patient, type, tags, source, date
- **Quick Search** - find content across all assets

### 5. Story Page Builder
- **Block-based editor** for creating patient experiences
- **Content block types**:
  - Video blocks
  - Image galleries
  - Text narratives
  - Reflection questions (open-ended)
  - Surveys (multiple choice, scales)
- **Mobile-optimized** patient view
- **Publishing workflow** - draft, review, publish
- **Version control** - track changes over time

### 6. Patient Engagement Analytics
- **Dashboard metrics**:
  - Active patients count
  - Published pages
  - Total responses received
  - Engagement rates
- **Patient drill-down**:
  - View count per story page
  - Reflection response rates
  - Survey completion
  - Last interaction timestamp
- **Risk identification** - flag inactive or at-risk patients
- **Recent responses** - real-time view of patient submissions

### 7. HIPAA-Compliant Security
- **Firebase Authentication** - enterprise-grade identity management
- **Role-based access control** - therapist/patient/admin permissions
- **15-minute idle timeout** - automatic logout for compliance
- **Comprehensive audit logging** - track all data access
- **Encryption** - at rest (database) and in transit (TLS 1.3)
- **Soft deletes** - 90-day retention before permanent deletion
- **Signed URLs** - temporary access to files (1-hour expiration)

---

## Technology Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - strict type safety
- **Tailwind CSS 4** - utility-first styling
- **React 19** - latest React features
- **React Hook Form + Zod** - form validation
- **Lucide React** - icon library

### Backend & Infrastructure
- **Next.js API Routes** - serverless backend
- **Neon PostgreSQL** - serverless database (autoscaling)
- **DrizzleORM** - type-safe database queries
- **Firebase Authentication** - user identity and auth
- **Google Cloud Storage** - file storage for audio/media
- **Vercel** - hosting and deployment

### AI & Machine Learning
- **Deepgram** - speech-to-text with speaker diarization
- **OpenAI GPT-4 Turbo** - therapeutic analysis and chat
- **OpenAI DALL-E 3** - image generation
- **Video Processing** - FFmpeg (planned)

### Monitoring & Security
- **Sentry** - error tracking
- **PostHog** - product analytics
- **LogTape + Better Stack** - logging
- **Arcjet** - bot detection, rate limiting, WAF

---

## Application Architecture

### Project Structure
```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Protected routes (therapist/admin)
│   │   ├── dashboard/       # Analytics dashboard
│   │   ├── sessions/        # Session management
│   │   ├── assets/          # Media library
│   │   ├── scenes/          # Video scene editor
│   │   ├── pages/           # Story page builder
│   │   ├── patients/        # Patient management
│   │   ├── groups/          # Therapy group management
│   │   └── admin/           # Admin panel
│   ├── story/[id]/          # Patient-facing story viewer
│   ├── sign-in/             # Authentication pages
│   └── api/                 # Backend API endpoints
├── components/              # React components
│   ├── ui/                  # Base UI components
│   ├── sessions/            # Session-related components
│   ├── dashboard/           # Dashboard components
│   ├── assets/              # Media library components
│   └── pages/               # Page builder components
├── libs/                    # Third-party integrations
│   ├── Firebase.ts          # Firebase client SDK
│   ├── FirebaseAdmin.ts     # Firebase Admin SDK
│   ├── DB.ts                # Database client
│   ├── GCS.ts               # Google Cloud Storage
│   ├── Deepgram.ts          # Deepgram API
│   ├── OpenAI.ts            # OpenAI API
│   └── AuditLogger.ts       # HIPAA audit logging
├── models/                  # Database schemas
│   └── Schema.ts            # DrizzleORM table definitions
├── services/                # Business logic
├── validations/             # Zod validation schemas
└── middleware.ts            # Auth & security middleware
```

### Database Schema (18 Tables)

**Users & Groups:**
- `users` - Therapists, patients, admins with role-based access
- `groups` - Therapy groups
- `group_members` - Group membership relationships

**Sessions & Transcripts:**
- `sessions` - Therapy session records with audio URLs
- `transcripts` - Full session transcripts from Deepgram
- `speakers` - Identified speakers (Speaker 0, 1, 2, etc.)
- `utterances` - Individual speech segments with timestamps

**AI & Content:**
- `ai_chat_messages` - AI assistant conversation history
- `therapeutic_prompts` - Reusable prompt templates
- `media_library` - Generated/uploaded images, videos, audio
- `quotes` - Extracted meaningful quotes from sessions
- `notes` - Therapist clinical notes

**Story Pages:**
- `story_pages` - Patient-facing content pages
- `page_blocks` - Content blocks within pages (video, image, text, etc.)
- `scenes` - Assembled video scenes
- `scene_clips` - Individual clips within scenes (timeline)

**Engagement & Analytics:**
- `reflection_questions` - Open-ended prompts for patient reflection
- `survey_questions` - Survey questions with answer choices
- `reflection_responses` - Patient text responses
- `survey_responses` - Patient survey submissions
- `patient_page_interactions` - Engagement tracking (views, time spent)

**HIPAA Compliance:**
- `audit_logs` - Comprehensive audit trail (7-year retention)
  - All data access, modifications, auth events
  - IP address, user agent, timestamps, metadata

---

## Core Workflows

### Workflow 1: Session to Story Page

1. **Upload Session Audio**
   - Therapist uploads .mp3/.m4a/.wav file (up to 500MB)
   - File stored in Google Cloud Storage
   - Session record created in database

2. **Transcribe with AI**
   - Deepgram processes audio
   - Speaker diarization identifies who's speaking
   - Transcript stored with timestamps and speaker labels

3. **Label Speakers**
   - Therapist identifies speakers (Therapist, Patient, Group Member)
   - Labels applied to all utterances

4. **Analyze with AI Assistant**
   - Therapist uses GPT-4 to analyze transcript
   - AI identifies themes, metaphors, progress
   - Suggests visual representations

5. **Generate Visual Media**
   - AI generates images (DALL-E 3) based on therapeutic themes
   - Optional: Upload patient reference photo for consistency
   - Images saved to patient's media library

6. **Create Story Page**
   - Therapist builds page with blocks (video, image, text)
   - Adds reflection questions and surveys
   - Previews mobile experience
   - Publishes for patient access

7. **Patient Engagement**
   - Patient receives link to story page
   - Views multimedia content
   - Answers reflection questions
   - Completes surveys

8. **Track Analytics**
   - Therapist monitors engagement metrics
   - Reviews patient responses
   - Adjusts treatment plan based on insights

### Workflow 2: AI-Assisted Therapeutic Analysis

1. **Open Transcript Viewer**
   - Therapist navigates to session transcript
   - Transcript displayed with speaker labels and timestamps

2. **Click to Play Audio**
   - Click any utterance to jump to that moment
   - Audio player syncs with transcript

3. **Select Text for Analysis**
   - Highlight any segment of transcript
   - Click "Analyze Selection" button

4. **Get AI Insights**
   - AI analyzes selected text in therapeutic context
   - Suggests themes, metaphors, intervention strategies
   - Provides research-backed recommendations

5. **Chat with AI**
   - Open AI assistant panel
   - Ask questions about session content
   - Get instant therapeutic insights
   - Chat history saved for future reference

6. **Extract Quotes**
   - Select meaningful statements
   - Save to quotes library
   - Use in story pages later

7. **Generate Media Prompts**
   - Ask AI to suggest image/video ideas
   - AI provides DALL-E prompts
   - One-click generation from suggestions

---

## Implementation Status

### ✅ Fully Implemented
- Firebase Authentication (client + server)
- User management (therapists, patients, groups)
- Session upload and management
- Deepgram transcription integration
- Speaker diarization and labeling
- Interactive transcript viewer with audio sync
- AI chat assistant (OpenAI GPT-4)
- Quote extraction and management
- Note-taking system
- Therapeutic prompt library
- Patient and group management
- Dashboard with basic metrics
- Google Cloud Storage integration
- Complete database schema
- Authentication middleware
- Security headers
- HIPAA audit logging
- 15-minute idle timeout

### 🚧 Partially Implemented
- Media library (structure exists, UI in progress)
- Scene editor (UI components built, assembly pending)
- Story page builder (schema ready, editor UI in progress)
- Image generation (API endpoint exists, UI integration pending)
- Analytics dashboard (basic metrics only)

### ❌ Not Yet Implemented
- Video generation (animation of images)
- Scene assembly (video processing with FFmpeg)
- Story page publishing workflow
- Patient-facing story page viewer
- Reflection questions and surveys (UI)
- Patient response tracking
- Email/SMS notifications
- Multi-factor authentication (MFA)
- Granular role-based access control (RBAC)
- Data export functionality
- Automated testing (E2E coverage)

---

## Security & Compliance

### HIPAA Compliance Features

**Implemented:**
1. **Data Encryption**
   - Database: AES-256 at rest (Neon PostgreSQL)
   - Transit: TLS 1.3 for all connections
   - Files: GCS server-side encryption

2. **Access Controls**
   - Firebase Authentication with role verification
   - Middleware protection on all protected routes
   - 15-minute idle timeout (auto-logout)
   - Session token verification on every API request

3. **Audit Logging**
   - Comprehensive audit_logs table
   - Tracks all CRUD operations on PHI
   - Auth events (login, logout, failed attempts)
   - IP address, user agent, timestamps
   - Metadata (old/new values for updates)

4. **Data Minimization**
   - Soft deletes for PHI data (90-day retention)
   - Signed URLs with 1-hour expiration for files
   - Role-based data access (therapist sees only their patients)

5. **Security Headers**
   - Content Security Policy (CSP)
   - X-Frame-Options: DENY (prevent clickjacking)
   - Strict-Transport-Security (HSTS)
   - X-Content-Type-Options: nosniff

**To Implement:**
- Multi-factor authentication (MFA) for therapists
- Business Associate Agreements (BAA) with vendors
- Breach notification system
- Patient data export (right to access)
- Data retention automation (7-year audit logs)
- Disaster recovery procedures
- Employee training documentation

---

## Development & Deployment

### Local Development
```bash
npm install                 # Install dependencies
npm run dev                 # Start dev server with PGlite
npm run db:migrate          # Run database migrations
npm run db:studio           # Open Drizzle Studio (DB GUI)
```

### Code Quality
```bash
npm run lint                # Check linting
npm run lint:fix            # Auto-fix linting issues
npm run check:types         # TypeScript type checking
npm run test                # Unit tests (Vitest)
npm run test:e2e            # E2E tests (Playwright)
```

### Deployment
- **Platform**: Vercel (automatic from main branch)
- **Database**: Neon PostgreSQL (serverless, autoscaling)
- **File Storage**: Google Cloud Storage
- **Environment Variables**: Managed in Vercel dashboard

### Required Environment Variables
- **Firebase**: API keys, project ID, service account JSON
- **Database**: `DATABASE_URL` (Neon connection string)
- **Google Cloud**: GCS credentials, bucket name
- **AI Services**: Deepgram API key, OpenAI API key
- **Monitoring**: Sentry DSN, PostHog key, Better Stack token

---

## Scaling Considerations

The application is designed for:

- **1,000 users**: Current implementation sufficient
- **10,000 users**: Need connection pooling, Redis caching
- **100,000 users**: Require:
  - Database connection pooling (Neon supports this)
  - Edge caching for static content (Vercel Edge)
  - Background job processing for video assembly
  - Rate limiting per user (Arcjet configured)
  - CDN for media files (GCS + Vercel Edge)
  - Horizontal scaling of API routes (Vercel handles this)

---

## Future Roadmap

### Short-Term (Next 3 months)
1. Complete video generation and scene assembly
2. Finish story page builder UI
3. Build patient-facing story page viewer
4. Implement reflection questions and surveys
5. Add patient response tracking
6. Complete analytics dashboard

### Medium-Term (3-6 months)
7. Implement MFA for therapist accounts
8. Add email/SMS notifications (SendGrid/Twilio)
9. Build admin dashboard for system monitoring
10. Implement data export functionality
11. Add E2E test coverage
12. Optimize database queries and caching

### Long-Term (6-12 months)
13. EHR system integration (FHIR API)
14. Advanced analytics and reporting
15. White-label capabilities
16. Mobile apps (React Native)
17. Real-time collaboration features
18. Internationalization (i18n)

---

## Key Differentiators

### What Makes StoryCare Unique?

1. **AI-First Approach**
   - Not just transcription - deep therapeutic analysis
   - GPT-4 trained on narrative therapy principles
   - Automated theme identification and tracking

2. **Visual Storytelling**
   - Transform abstract concepts into concrete images
   - Patient reference photos for personalized AI generation
   - Video scenes that bring narratives to life

3. **Clinician-Guided Platform**
   - Therapist maintains full control
   - AI assists, doesn't replace clinical judgment
   - Tools designed for therapeutic workflow

4. **Patient Engagement Focus**
   - Mobile-optimized story pages
   - Interactive reflection questions
   - Measurable engagement metrics

5. **HIPAA-Compliant by Design**
   - Built with compliance from day one
   - Comprehensive audit logging
   - Enterprise-grade security

6. **Modern Tech Stack**
   - Production-ready from the start
   - Scalable architecture
   - Low operational overhead (serverless)

---

## Technical Highlights

### Well-Architected Application
- **Type Safety**: Full TypeScript coverage with strict mode
- **Database**: DrizzleORM provides type-safe queries
- **Validation**: Zod schemas for all user inputs
- **Error Handling**: Sentry for comprehensive error tracking
- **Observability**: LogTape + Better Stack for debugging
- **Security**: Multiple layers (auth, middleware, headers, audit logs)

### Production-Ready Stack
- **Hosting**: Vercel Enterprise (automatic scaling, edge network)
- **Database**: Neon PostgreSQL (serverless, autoscaling, point-in-time recovery)
- **Auth**: Firebase (Google Identity Platform, HIPAA-compliant with BAA)
- **Storage**: Google Cloud Storage (global CDN, versioning)
- **Monitoring**: Sentry + PostHog + Better Stack

### Developer Experience
- **Fast Local Development**: PGlite in-memory database
- **Type-Safe**: TypeScript + DrizzleORM catch errors at compile time
- **Database GUI**: Drizzle Studio for easy data management
- **Hot Reload**: Next.js fast refresh
- **Linting**: ESLint + Prettier for code consistency
- **Testing**: Vitest + Playwright for comprehensive coverage

---

## Conclusion

**StoryCare** is a sophisticated, enterprise-grade digital therapeutic platform that bridges the gap between traditional narrative therapy and modern AI-powered visual storytelling. The application provides therapists with powerful tools to analyze therapy sessions, generate personalized multimedia content, and track patient engagement - all within a HIPAA-compliant, production-ready architecture.

With a solid technical foundation in place (authentication, database, AI integrations, security), the primary development focus is now on completing the patient-facing features (story pages, reflections, surveys) and video processing capabilities. Once these features are delivered, StoryCare will offer a complete end-to-end platform for transforming therapeutic conversations into engaging visual narratives that help patients reframe their stories and create new possibilities.

### Current State
- **Authentication & Security**: Production-ready ✅
- **Session Management**: Fully functional ✅
- **AI Analysis**: Operational ✅
- **Media Generation**: Basic implementation ✅
- **Patient Features**: In development 🚧
- **Analytics**: Basic metrics ✅

### Target State
A comprehensive platform where therapists can seamlessly move from session upload to patient engagement, with AI assistance at every step, rich multimedia storytelling, and actionable analytics - all while maintaining the highest standards of security and HIPAA compliance.

---

**Last Updated**: 2025-11-06
**Application Type**: Digital Therapeutic Platform (SaaS)
**Primary Market**: Mental Health Professionals & Patients
**Compliance**: HIPAA-ready (BAAs required)
**Technology**: Next.js 16, TypeScript, Firebase, Neon PostgreSQL, OpenAI
