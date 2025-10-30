# Getting Started with StoryCare

Welcome! This guide will get you up and running with StoryCare development in **under 30 minutes**.

## Quick Start

```bash
# 1. Clone and install
git clone <your-repo>
cd Next-js-Boilerplate
npm install

# 2. Set up environment (see below)
cp .env.example .env.local
# Edit .env.local with your credentials

# 3. Run migrations
npm run db:migrate

# 4. Start development server
npm run dev:simple
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## Prerequisites

- **Node.js 20+** ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))
- **Firebase account** (free) - [Sign up](https://firebase.google.com/)
- **Code editor** (VS Code recommended)

**Optional for full features**:
- Deepgram account (free $200 credits)
- OpenAI account (paid)
- Google Cloud account (GCS)

---

## Step-by-Step Setup

### Step 1: Install Dependencies

```bash
npm install
```

This installs all required packages including:
- Next.js 16
- DrizzleORM
- Firebase
- TypeScript
- Tailwind CSS 4

**Time**: 2-3 minutes

---

### Step 2: Set Up Firebase Authentication

Firebase is **required** to run the application.

#### 2.1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it: `storycare-dev`
4. Disable Google Analytics (optional)
5. Click "Create project"

#### 2.2: Enable Authentication

1. Click "Authentication" → "Get started"
2. Go to "Sign-in method" tab
3. Enable "Email/Password"
4. Enable "Google" (recommended)

#### 2.3: Register Web App

1. Click gear icon ⚙️ → "Project settings"
2. Scroll to "Your apps" → Click web icon `</>`
3. Name: `StoryCare Web`
4. Copy the config object

#### 2.4: Get Service Account Key

1. "Project settings" → "Service accounts"
2. Click "Generate new private key"
3. Download JSON file (save securely!)

**Detailed guide**: [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

**Time**: 10-15 minutes

---

### Step 3: Configure Environment Variables

Create `.env.local` in project root:

```bash
touch .env.local
```

Add Firebase credentials (from step 2):

```bash
###############################################################################
# FIREBASE AUTHENTICATION (Required)
###############################################################################

# From Firebase Console → Project settings → Your apps
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=storycare-dev.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=storycare-dev
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=storycare-dev.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc...

# From downloaded service account JSON
FIREBASE_PROJECT_ID=storycare-dev
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@storycare-dev.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"

###############################################################################
# DATABASE (Required)
###############################################################################

# Local development (PGlite - default)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres

###############################################################################
# NEXT.JS (Required)
###############################################################################

NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_APP_URL=http://localhost:3000

###############################################################################
# AI SERVICES (Optional - for full features)
###############################################################################

# Deepgram (Speech-to-Text)
# DEEPGRAM_API_KEY=your_key

# OpenAI (GPT-4, DALL-E)
# OPENAI_API_KEY=sk-proj-...

# Google Cloud Storage
# GCS_PROJECT_ID=your_project
# GCS_CLIENT_EMAIL=your_service_account@...
# GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# GCS_BUCKET_NAME=your_bucket
```

**Important**: The `.env.local` file is git-ignored. Never commit credentials!

**Time**: 5 minutes

---

### Step 4: Update Environment Validation

Update `src/libs/Env.ts` to validate Firebase variables.

**Current file has Clerk validation - needs to be replaced with Firebase**.

See [FIREBASE_SETUP.md#step-52-update-environment-validation](./FIREBASE_SETUP.md#step-52-update-environment-validation) for complete code.

**Time**: 3 minutes

---

### Step 5: Run Database Migrations

```bash
npm run db:migrate
```

This creates all database tables defined in `src/models/Schema.ts`.

**What happens**:
- Connects to PGlite (local PostgreSQL)
- Creates 15 tables for StoryCare
- Sets up foreign keys and constraints

**Expected output**:
```
🔍 Checking migrations...
📝 Applying migration: 0000_init-db
✅ Migration complete!
```

**Time**: 1 minute

---

### Step 6: Start Development Server

```bash
npm run dev:simple
```

**What this does**:
- Starts Next.js on http://localhost:3000
- Auto-starts PGlite database
- Enables hot reload

**Expected output**:
```
   ▲ Next.js 16.0.0
   - Local:        http://localhost:3000

 ✓ Starting...
 ✓ Ready in 2.3s
```

Open browser to [http://localhost:3000](http://localhost:3000) ✅

**Time**: 30 seconds

---

## First Steps

### 1. Create Your First User

1. Navigate to http://localhost:3000/sign-in
2. Click "Sign up"
3. Enter email and password
4. Or use "Sign in with Google"

**Verify**: Check Firebase Console → Authentication → Users

### 2. Explore the Dashboard

After signing in, you'll see:
- **Dashboard**: Engagement metrics (empty for now)
- **Sessions**: Upload therapy sessions
- **Assets**: Media library
- **Scenes**: Video editor
- **Pages**: Story page builder

### 3. Open Drizzle Studio

```bash
npm run db:studio
```

Opens https://local.drizzle.studio

- View all tables
- See your user record
- Add test data

---

## Project Structure Overview

```
Next-js-Boilerplate/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [locale]/          # Internationalization
│   │   │   ├── (auth)/        # Protected routes (therapist)
│   │   │   │   ├── dashboard/
│   │   │   │   ├── sessions/
│   │   │   │   ├── assets/
│   │   │   │   ├── scenes/
│   │   │   │   ├── pages/
│   │   │   │   └── admin/
│   │   │   └── api/           # API routes
│   │   └── layout.tsx
│   ├── components/            # React components
│   │   ├── layout/           # Sidebar, TopBar
│   │   ├── sessions/         # Session components
│   │   ├── assets/           # Media components
│   │   └── ui/               # Reusable UI components
│   ├── libs/                  # Third-party configs
│   │   ├── Firebase.ts       # Firebase client
│   │   ├── FirebaseAdmin.ts  # Firebase admin SDK
│   │   ├── DB.ts             # Database client
│   │   ├── Env.ts            # Environment validation
│   │   └── ...
│   ├── models/
│   │   └── Schema.ts         # Database schema (Drizzle)
│   ├── styles/
│   │   └── global.css        # Tailwind + custom styles
│   └── utils/                 # Helper functions
├── migrations/                # Database migrations
├── public/                    # Static assets
├── .env.local                # Your credentials (git-ignored)
├── .env.example              # Example env file
├── drizzle.config.ts         # Drizzle ORM config
├── next.config.ts            # Next.js config
├── package.json              # Dependencies & scripts
├── tailwind.config.ts        # Tailwind config
└── tsconfig.json             # TypeScript config
```

---

## Key Commands

### Development
```bash
npm run dev                # Full dev (Next.js + Spotlight)
npm run dev:simple         # Next.js only (recommended)
npm run build              # Production build
npm run start              # Run production build
```

### Database
```bash
npm run db:generate        # Generate migration
npm run db:migrate         # Apply migrations
npm run db:studio          # Open Drizzle Studio
```

### Testing
```bash
npm run test               # Unit tests
npm run test:e2e           # E2E tests
npm run lint               # Lint code
npm run check:types        # Type check
```

---

## Common Issues & Solutions

### Issue: Dev server exits immediately

**Cause**: Missing Firebase credentials

**Solution**:
1. Check `.env.local` exists
2. Verify all Firebase variables are set
3. Ensure `FIREBASE_PRIVATE_KEY` is in quotes with `\n`
4. See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

### Issue: "Invalid API Key" (Firebase)

**Solution**:
- Double-check `NEXT_PUBLIC_FIREBASE_API_KEY`
- No extra spaces or quotes
- Restart dev server after changing env vars

### Issue: "Unauthorized Domain" (Firebase)

**Solution**:
1. Firebase Console → Authentication → Settings → Authorized domains
2. Add `localhost`

### Issue: Database connection error

**Solution**:
```bash
# Ensure DATABASE_URL is set
echo $DATABASE_URL

# Re-run migrations
npm run db:migrate

# Check with Drizzle Studio
npm run db:studio
```

### Issue: TypeScript errors

**Solution**:
```bash
# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"

# Or check types manually
npm run check:types
```

---

## Next Steps

### 1. Set Up AI Services (Optional but Recommended)

For full StoryCare functionality:

- **Deepgram**: Transcribe session audio → [SETUP_GUIDE.md#4-deepgram](./SETUP_GUIDE.md#4-deepgram-speech-to-text-setup)
- **OpenAI**: AI insights & image generation → [SETUP_GUIDE.md#5-openai](./SETUP_GUIDE.md#5-openai-api-setup)
- **Google Cloud Storage**: File uploads → [SETUP_GUIDE.md#3-gcs](./SETUP_GUIDE.md#3-google-cloud-storage-gcs-setup)

### 2. Understand the Database Schema

Read [DATABASE_GUIDE.md](./DATABASE_GUIDE.md) to understand:
- 15 tables and their relationships
- How to query data with Drizzle
- Adding new tables and migrations

### 3. Read Project Documentation

- **CLAUDE.md**: Full project architecture and guidelines
- **SETUP_GUIDE.md**: Complete service setup (all credentials)
- **FIREBASE_SETUP.md**: Detailed Firebase configuration
- **DATABASE_GUIDE.md**: Database management

### 4. Build Your First Feature

Try adding a simple feature:
1. Create API route: `src/app/api/hello/route.ts`
2. Create page: `src/app/[locale]/(auth)/hello/page.tsx`
3. Add to navigation

### 5. Deploy to Vercel (When Ready)

```bash
npm install -g vercel
vercel login
vercel link
vercel --prod
```

See [SETUP_GUIDE.md#13-production-deployment](./SETUP_GUIDE.md#13-production-deployment-vercel)

---

## Development Workflow

### Making Changes

```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Make changes to code

# 3. If adding database tables, update schema
# src/models/Schema.ts

# 4. Generate and run migration
npm run db:generate
npm run db:migrate

# 5. Test your changes
npm run lint
npm run check:types
npm run test

# 6. Commit changes
git add .
git commit -m "feat: add your feature"

# 7. Push and create PR
git push origin feature/your-feature
```

### Code Quality Checks

Before committing:
```bash
npm run lint          # Check linting
npm run lint:fix      # Auto-fix issues
npm run check:types   # TypeScript errors
npm run test          # Unit tests
```

---

## Getting Help

### Documentation
- [CLAUDE.md](./CLAUDE.md) - Project overview
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - All service setups
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Firebase details
- [DATABASE_GUIDE.md](./DATABASE_GUIDE.md) - Database management

### Official Docs
- [Next.js](https://nextjs.org/docs)
- [Firebase](https://firebase.google.com/docs)
- [DrizzleORM](https://orm.drizzle.team/docs/overview)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Community
- Next.js Discord: https://nextjs.org/discord
- Firebase Community: https://firebase.google.com/community

---

## Minimum Setup for Development

If you want to start **quickly with minimal setup**:

**Required**:
- [x] Firebase Authentication (see Step 2)
- [x] Environment variables (see Step 3)
- [x] Database migrations (see Step 5)

**Optional** (can add later):
- [ ] Deepgram (transcription)
- [ ] OpenAI (AI generation)
- [ ] GCS (file storage)
- [ ] Monitoring services (Sentry, PostHog, etc.)

You can build and test most features without AI services!

---

## Success Checklist

- [ ] `npm install` completed
- [ ] Firebase project created
- [ ] `.env.local` configured with Firebase
- [ ] `npm run db:migrate` successful
- [ ] `npm run dev:simple` starts without errors
- [ ] Can access http://localhost:3000
- [ ] Can sign up / sign in
- [ ] User appears in Firebase Console
- [ ] Can view database in Drizzle Studio

**If all checked**: You're ready to develop! 🚀

---

## What's Next?

1. **Explore the codebase**
   - Read `src/models/Schema.ts` for database structure
   - Check `src/app/[locale]/(auth)/` for existing pages
   - Look at `src/components/` for UI components

2. **Add test data**
   - Open Drizzle Studio: `npm run db:studio`
   - Manually add sessions, media, etc.
   - Or create seed script

3. **Build your first feature**
   - Follow examples in existing code
   - Use TypeScript types from Schema.ts
   - Test with Firebase auth

4. **Set up production**
   - When ready, follow [SETUP_GUIDE.md](./SETUP_GUIDE.md)
   - Deploy to Vercel
   - Configure production services

---

**Estimated Total Setup Time**: 20-30 minutes

**Questions?** Check the troubleshooting section or open an issue on GitHub.

**Last Updated**: 2025-10-30
