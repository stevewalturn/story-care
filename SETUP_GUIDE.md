# StoryCare Complete Setup Guide

This comprehensive guide walks you through setting up all required services and credentials for the StoryCare platform. Follow these steps in order for the smoothest setup experience.

## Table of Contents

1. [Quick Start Checklist](#quick-start-checklist)
2. [Firebase Authentication Setup](#1-firebase-authentication-setup)
3. [Database Setup (Neon PostgreSQL)](#2-database-setup-neon-postgresql)
4. [Google Cloud Storage (GCS) Setup](#3-google-cloud-storage-gcs-setup)
5. [Deepgram (Speech-to-Text) Setup](#4-deepgram-speech-to-text-setup)
6. [OpenAI API Setup](#5-openai-api-setup)
7. [Arcjet Security Setup](#6-arcjet-security-setup)
8. [Sentry Error Tracking Setup](#7-sentry-error-tracking-setup)
9. [PostHog Analytics Setup](#8-posthog-analytics-setup)
10. [Better Stack Logging Setup](#9-better-stack-logging-setup)
11. [Checkly Monitoring Setup](#10-checkly-monitoring-setup)
12. [Environment Variables Summary](#11-environment-variables-summary)
13. [Final Configuration](#12-final-configuration)
14. [Troubleshooting](#troubleshooting)

---

## Quick Start Checklist

### Essential Services (Required to Run)
- [ ] Firebase Authentication
- [ ] Database (PGlite for local, Neon for production)
- [ ] Environment variables configured

### AI Services (Required for Core Features)
- [ ] Deepgram API (transcription)
- [ ] OpenAI API (AI generation)
- [ ] Google Cloud Storage (file storage)

### Production Services (Optional for Development)
- [ ] Arcjet (security)
- [ ] Sentry (error tracking)
- [ ] PostHog (analytics)
- [ ] Better Stack (logging)
- [ ] Checkly (monitoring)

**Estimated Total Setup Time**: 2-3 hours

---

## 1. Firebase Authentication Setup

Firebase provides authentication, user management, and supports multiple sign-in methods.

### Why Firebase?
- Passwordless authentication & magic links
- Social auth (Google, Facebook, Twitter, GitHub, Apple)
- Phone authentication & MFA
- Built-in user management
- No server-side session management needed

### Setup Steps

#### 1.1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. **Project name**: `storycare-dev` (or your choice)
4. **Google Analytics**: Toggle OFF for quick setup
5. Click **"Create project"**
6. Wait 30-60 seconds

#### 1.2: Enable Authentication Methods
1. In Firebase Console sidebar: **Build** → **Authentication**
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab

**Enable Email/Password:**
- Click "Email/Password"
- Toggle **Enable** to ON
- Click **Save**

**Enable Google Sign-In:**
- Click "Google"
- Toggle **Enable** to ON
- Select **Project support email**
- Click **Save**

#### 1.3: Register Web App & Get Config
1. Click gear icon ⚙️ → **Project settings**
2. Scroll to "Your apps" → Click Web icon `</>`
3. **App nickname**: `StoryCare Web`
4. Click **"Register app"**
5. Copy the config object:

```javascript
{
  apiKey: "AIzaSy...",
  authDomain: "storycare-dev.firebaseapp.com",
  projectId: "storycare-dev",
  storageBucket: "storycare-dev.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc..."
}
```

#### 1.4: Get Service Account Key (Admin SDK)
1. Still in **Project settings** → **Service accounts** tab
2. Click **"Generate new private key"**
3. Click **"Generate key"** in dialog
4. A JSON file downloads (e.g., `storycare-dev-firebase-adminsdk.json`)

**⚠️ CRITICAL**: Never commit this file to Git!

#### 1.5: Add to Environment Variables
Add to `.env.local`:

```bash
# Firebase Client (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=storycare-dev.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=storycare-dev
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=storycare-dev.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc...

# Firebase Admin (Private - from downloaded JSON)
FIREBASE_PROJECT_ID=storycare-dev
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@storycare-dev.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

**✅ Verification**: Run `npm run dev:simple` - should not error on Firebase config

📖 **Detailed Guide**: See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

---

## 2. Database Setup (Neon PostgreSQL)

### Local Development: PGlite (No Setup Needed!)
- PGlite is already included - runs in-memory
- Automatic with `npm run dev`
- No Docker, no PostgreSQL installation needed

### Production: Neon PostgreSQL

#### 2.1: Create Neon Account
1. Go to [Neon Console](https://console.neon.tech/)
2. Sign up with GitHub (recommended)
3. Click **"Create a project"**

#### 2.2: Create Database
1. **Project name**: `storycare-prod`
2. **Database name**: `storycare`
3. **Region**: Choose closest to your users
4. Click **"Create project"**

#### 2.3: Get Connection String
1. On project dashboard, find **"Connection string"**
2. Select **"Pooled connection"** (recommended)
3. Copy the connection string:

```
postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/storycare?sslmode=require
```

#### 2.4: Add to Environment Variables

**For local development** (`.env.local`):
```bash
# Use PGlite (default, no changes needed)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres
```

**For production** (Vercel):
```bash
# Use Neon
DATABASE_URL=postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/storycare?sslmode=require
```

#### 2.5: Run Migrations
```bash
npm run db:migrate
```

**✅ Verification**: Run `npm run db:studio` to open Drizzle Studio

---

## 3. Google Cloud Storage (GCS) Setup

GCS stores uploaded files, session audio, and generated media assets.

### Why GCS?
- Scalable file storage
- Direct upload from browser
- CDN integration
- Cost-effective for large files

### Setup Steps

#### 3.1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click project dropdown → **"New Project"**
3. **Project name**: `storycare-storage`
4. Click **"Create"**

#### 3.2: Enable Cloud Storage API
1. In search bar, type "Cloud Storage API"
2. Click **"Cloud Storage API"**
3. Click **"Enable"**

#### 3.3: Create Storage Bucket
1. In left menu: **Cloud Storage** → **Buckets**
2. Click **"Create bucket"**
3. **Bucket name**: `storycare-media-dev` (must be globally unique)
4. **Location type**: Region (choose your region)
5. **Storage class**: Standard
6. **Access control**: Uniform
7. **Public access**: Do not allow (we'll use signed URLs)
8. Click **"Create"**

#### 3.4: Create Service Account
1. In left menu: **IAM & Admin** → **Service Accounts**
2. Click **"Create service account"**
3. **Service account name**: `storycare-storage-admin`
4. Click **"Create and continue"**
5. **Role**: Storage Admin
6. Click **"Continue"** → **"Done"**

#### 3.5: Generate Service Account Key
1. Click on the service account you just created
2. Go to **"Keys"** tab
3. Click **"Add key"** → **"Create new key"**
4. **Key type**: JSON
5. Click **"Create"**
6. JSON file downloads (e.g., `storycare-storage-xxxxx.json`)

**⚠️ CRITICAL**: Never commit this file to Git!

#### 3.6: Add to Environment Variables
Open the downloaded JSON file and add to `.env.local`:

```bash
# Google Cloud Storage
GCS_PROJECT_ID=storycare-storage
GCS_CLIENT_EMAIL=storycare-storage-admin@storycare-storage.iam.gserviceaccount.com
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
GCS_BUCKET_NAME=storycare-media-dev
```

**✅ Verification**: Test file upload in your app

---

## 4. Deepgram (Speech-to-Text) Setup

Deepgram provides real-time and batch audio transcription.

### Why Deepgram?
- Superior accuracy for therapy sessions
- Speaker diarization (identify different speakers)
- Punctuation & formatting
- Fast processing
- Cost-effective

### Setup Steps

#### 4.1: Create Deepgram Account
1. Go to [Deepgram Console](https://console.deepgram.com/)
2. Click **"Sign Up"**
3. Use email or GitHub
4. Verify your email

#### 4.2: Get Free Credits
- New accounts get **$200 in free credits**
- Enough for ~100 hours of audio transcription
- No credit card required initially

#### 4.3: Create API Key
1. In Deepgram Console, go to **"API Keys"**
2. Click **"Create a New API Key"**
3. **Key name**: `StoryCare Dev`
4. **Permissions**: Admin (for development)
5. Click **"Create Key"**
6. Copy the API key (starts with something like `abc123...`)

**⚠️ IMPORTANT**: Save this key - you can't view it again!

#### 4.4: Add to Environment Variables
Add to `.env.local`:

```bash
# Deepgram API
DEEPGRAM_API_KEY=abc123...your_key_here
```

#### 4.5: Test API Key
```bash
curl -X POST https://api.deepgram.com/v1/listen \
  -H "Authorization: Token YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://static.deepgram.com/examples/interview_speech-analytics.wav"}'
```

**✅ Verification**: Should return transcription JSON

### Pricing Notes
- **Pay as you go**: $0.0043/minute ($0.258/hour)
- **Batch transcription**: Cheaper than real-time
- **Speaker diarization**: No extra cost
- Monitor usage in console

---

## 5. OpenAI API Setup

OpenAI powers AI assistants, text generation, and image generation (DALL-E).

### Why OpenAI?
- GPT-4 for therapeutic insights
- DALL-E for image generation
- Embeddings for semantic search
- Industry-leading quality

### Setup Steps

#### 5.1: Create OpenAI Account
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Click **"Sign Up"**
3. Verify email and phone number

#### 5.2: Add Payment Method
1. Go to **Settings** → **Billing**
2. Click **"Add payment method"**
3. Add credit card
4. Set usage limits (recommended: $50/month for development)

**Note**: OpenAI no longer offers free credits for new accounts.

#### 5.3: Create API Key
1. Go to **API Keys** (left sidebar)
2. Click **"Create new secret key"**
3. **Name**: `StoryCare Dev`
4. **Permissions**: All (for development)
5. Click **"Create secret key"**
6. Copy the key (starts with `sk-proj-...`)

**⚠️ CRITICAL**: Save immediately - can't view again!

#### 5.4: Add to Environment Variables
Add to `.env.local`:

```bash
# OpenAI API
OPENAI_API_KEY=sk-proj-...your_key_here
```

#### 5.5: Test API Key
```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

**✅ Verification**: Should return chat completion

### Pricing Notes
- **GPT-3.5-turbo**: $0.50 / 1M input tokens, $1.50 / 1M output tokens
- **GPT-4**: $10 / 1M input tokens, $30 / 1M output tokens
- **GPT-4o** (multimodal): $2.50 / 1M input tokens, $10 / 1M output tokens
- **DALL-E 3**: $0.04 - $0.12 per image
- Set budget alerts in billing settings

---

## 6. Arcjet Security Setup

Arcjet provides bot protection, rate limiting, and WAF (Web Application Firewall).

### Why Arcjet?
- Blocks malicious bots
- API rate limiting
- Shield WAF (OWASP Top 10)
- Email validation
- PII detection

### Setup Steps

#### 6.1: Create Arcjet Account
1. Go to [Arcjet Launch](https://launch.arcjet.com/Q6eLbRE)
2. Click **"Sign up with GitHub"** (recommended)
3. Authorize Arcjet

#### 6.2: Create New Site
1. Click **"Add site"**
2. **Site name**: `storycare-dev`
3. **Environment**: Development
4. Click **"Create"**

#### 6.3: Get API Key
1. On site dashboard, find **"API Key"**
2. Copy the key (starts with `ajkey_...`)
3. Click **"Show key"** to reveal full key

#### 6.4: Add to Environment Variables
Add to `.env.local`:

```bash
# Arcjet Security
ARCJET_KEY=ajkey_...your_key_here
```

**✅ Verification**: Run app - should not see Arcjet errors

### Pricing
- **Free tier**: 100,000 requests/month
- **Pro**: $20/month for 1M requests
- Includes all features

---

## 7. Sentry Error Tracking Setup

Sentry captures errors, performance issues, and provides debugging context.

### Why Sentry?
- Real-time error alerts
- Stack traces with source maps
- User context & breadcrumbs
- Performance monitoring
- Release tracking

### Setup Steps

#### 7.1: Create Sentry Account
1. Go to [Sentry.io](https://sentry.io/signup/)
2. Sign up with GitHub (recommended)
3. Choose free plan

#### 7.2: Create New Project
1. Click **"Create Project"**
2. **Platform**: Next.js
3. **Project name**: `storycare-web`
4. **Alert frequency**: I'll create my own alerts
5. Click **"Create Project"**

#### 7.3: Get DSN
1. On project page, find **"Client Keys (DSN)"**
2. Copy the DSN URL:
   ```
   https://abc123@o123.ingest.sentry.io/456
   ```

#### 7.4: Create Auth Token
1. Go to **Settings** → **Auth Tokens**
2. Click **"Create New Token"**
3. **Scopes**: Check "project:releases" and "org:read"
4. Click **"Create Token"**
5. Copy the token

#### 7.5: Add to Environment Variables
Add to `.env.local`:

```bash
# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://abc123@o123.ingest.sentry.io/456
SENTRY_AUTH_TOKEN=your_auth_token
SENTRY_ORGANIZATION=your_org_slug
SENTRY_PROJECT=storycare-web
```

#### 7.6: Test Sentry
```bash
npm run dev:simple
```

Trigger a test error in your app - should appear in Sentry dashboard.

**✅ Verification**: Check Sentry dashboard for test error

### Pricing
- **Free**: 5,000 errors/month
- **Team**: $26/month for 50,000 errors
- **Business**: Custom pricing

---

## 8. PostHog Analytics Setup

PostHog provides product analytics, feature flags, and session recording.

### Why PostHog?
- Privacy-focused analytics
- Session replay
- Feature flags
- Heatmaps
- User path analysis
- Self-hostable option

### Setup Steps

#### 8.1: Create PostHog Account
1. Go to [PostHog Cloud](https://app.posthog.com/signup)
2. Sign up with email or Google
3. Choose **PostHog Cloud** (easiest)

#### 8.2: Create Project
1. **Project name**: `StoryCare`
2. **URL**: Your app URL (can change later)
3. Click **"Create project"**

#### 8.3: Get API Key
1. On project setup page, find **"Project API Key"**
2. Copy the key (starts with `phc_...`)
3. Note the **Host URL**: `https://us.i.posthog.com` or `https://eu.i.posthog.com`

#### 8.4: Add to Environment Variables
Add to `.env.local`:

```bash
# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_...your_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

**✅ Verification**: Visit your app, then check PostHog dashboard for live users

### Pricing
- **Free**: 1M events/month
- **Paid**: $0.000225 per event after free tier
- Session recording included

---

## 9. Better Stack Logging Setup

Better Stack (formerly Logtail) provides centralized logging and log analysis.

### Why Better Stack?
- Structured logging
- Real-time log tailing
- Log search & filtering
- Alerts on log patterns
- Integrates with LogTape

### Setup Steps

#### 9.1: Create Better Stack Account
1. Go to [Better Stack](https://betterstack.com/)
2. Click **"Start free trial"**
3. Sign up with email or GitHub

#### 9.2: Create Source
1. Go to **Logs** → **Sources**
2. Click **"Connect source"**
3. Choose **"HTTP"** or **"Custom source"**
4. **Source name**: `StoryCare App`
5. Click **"Create source"**

#### 9.3: Get Source Token
1. On source page, copy the **Source Token**
2. Copy the **Ingesting Host** URL

#### 9.4: Add to Environment Variables
Add to `.env.local`:

```bash
# Better Stack Logging
NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN=your_source_token
NEXT_PUBLIC_BETTER_STACK_INGESTING_HOST=logs.betterstack.com
```

**✅ Verification**: Run app, check Better Stack for incoming logs

### Pricing
- **Free**: 1GB logs/month, 7-day retention
- **Startup**: $20/month for 10GB, 30-day retention
- **Business**: Custom pricing

---

## 10. Checkly Monitoring Setup

Checkly provides synthetic monitoring and API testing.

### Why Checkly?
- Uptime monitoring
- API checks
- Browser checks
- Alerts (Slack, email, SMS)
- Playwright-based E2E tests

### Setup Steps

#### 10.1: Create Checkly Account
1. Go to [Checkly](https://www.checklyhq.com/)
2. Click **"Start free"**
3. Sign up with email or GitHub

#### 10.2: Create API Check
1. Click **"Create check"**
2. Choose **"API check"**
3. **URL**: `https://your-app.vercel.app/api/health`
4. **Frequency**: Every 5 minutes
5. Click **"Save check"**

#### 10.3: Get API Key
1. Go to **Settings** → **API Keys**
2. Click **"Create API key"**
3. **Name**: `StoryCare CI`
4. Copy the **API Key** and **Account ID**

#### 10.4: Add to Environment Variables
Add to `.env.local`:

```bash
# Checkly Monitoring
CHECKLY_API_KEY=your_api_key
CHECKLY_ACCOUNT_ID=your_account_id
```

**✅ Verification**: Deploy to Vercel, check Checkly dashboard

### Pricing
- **Free**: 10 checks, 5 min intervals
- **Developer**: $20/month for 100 checks
- **Team**: $80/month for 500 checks

---

## 11. Environment Variables Summary

Create `.env.local` in your project root with all credentials:

```bash
###############################################################################
# FIREBASE AUTHENTICATION
###############################################################################

# Firebase Client (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=storycare-dev.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=storycare-dev
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=storycare-dev.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc...

# Firebase Admin (Private)
FIREBASE_PROJECT_ID=storycare-dev
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@storycare-dev.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"

###############################################################################
# DATABASE
###############################################################################

# Local: PGlite (default)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres

# Production: Neon (use in Vercel)
# DATABASE_URL=postgresql://user:pass@ep-xyz.neon.tech/storycare?sslmode=require

###############################################################################
# GOOGLE CLOUD STORAGE
###############################################################################

GCS_PROJECT_ID=storycare-storage
GCS_CLIENT_EMAIL=storycare-storage@storycare-storage.iam.gserviceaccount.com
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
GCS_BUCKET_NAME=storycare-media-dev

###############################################################################
# AI SERVICES
###############################################################################

# Deepgram (Speech-to-Text)
DEEPGRAM_API_KEY=abc123...

# OpenAI (GPT-4, DALL-E)
OPENAI_API_KEY=sk-proj-...

###############################################################################
# SECURITY
###############################################################################

# Arcjet (Bot protection, rate limiting)
ARCJET_KEY=ajkey_...

###############################################################################
# MONITORING & ANALYTICS (Optional for Dev)
###############################################################################

# Sentry (Error tracking)
NEXT_PUBLIC_SENTRY_DSN=https://abc@o123.ingest.sentry.io/456
SENTRY_AUTH_TOKEN=your_token
SENTRY_ORGANIZATION=your_org
SENTRY_PROJECT=storycare-web

# PostHog (Analytics)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Better Stack (Logging)
NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN=your_token
NEXT_PUBLIC_BETTER_STACK_INGESTING_HOST=logs.betterstack.com

# Checkly (Monitoring)
CHECKLY_API_KEY=your_key
CHECKLY_ACCOUNT_ID=your_account_id

###############################################################################
# NEXT.JS
###############################################################################

NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 12. Final Configuration

### 12.1: Update Env.ts Validation
Make sure `src/libs/Env.ts` validates all required variables (see FIREBASE_SETUP.md for complete code).

### 12.2: Install Required Packages
```bash
npm install firebase firebase-admin @deepgram/sdk openai @google-cloud/storage
```

### 12.3: Run Database Migrations
```bash
npm run db:migrate
```

### 12.4: Test Development Server
```bash
npm run dev:simple
```

Should start without errors and be accessible at `http://localhost:3000`

### 12.5: Create First User
1. Navigate to `/sign-in`
2. Sign up with email/password or Google
3. Check Firebase Console for new user

**✅ Full Stack Verification**:
- [ ] Dev server starts without errors
- [ ] Can sign in with Firebase
- [ ] Database migrations applied
- [ ] No console errors
- [ ] Sentry receives test error
- [ ] PostHog shows page view

---

## 13. Production Deployment (Vercel)

### 13.1: Connect to Vercel
```bash
npm install -g vercel
vercel login
vercel link
```

### 13.2: Add Environment Variables in Vercel
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add ALL variables from `.env.local`
3. Set for: **Production**, **Preview**, **Development**

**Important**: Use production values for:
- `DATABASE_URL` (Neon production)
- `GCS_BUCKET_NAME` (production bucket)
- Firebase production config

### 13.3: Deploy
```bash
vercel --prod
```

### 13.4: Configure Firebase Production Domains
1. Firebase Console → Authentication → Settings → Authorized domains
2. Add your production domain (e.g., `storycare.app`)
3. Add Vercel preview domains: `*.vercel.app`

### 13.5: Set Up GCS Production Bucket
- Create separate bucket: `storycare-media-prod`
- Configure CORS for production domain
- Update `GCS_BUCKET_NAME` in Vercel env vars

---

## Troubleshooting

### Server Exits Immediately
**Cause**: Missing or invalid environment variables

**Solution**:
```bash
# Check environment variables
npm run dev:simple 2>&1

# Validate .env.local exists
ls -la .env.local

# Check for syntax errors
node -e "require('dotenv').config({ path: '.env.local' })"
```

### Firebase "Invalid API Key"
**Cause**: Incorrect or missing Firebase config

**Solution**:
- Verify `NEXT_PUBLIC_FIREBASE_API_KEY` is correct
- Ensure no extra spaces or quotes
- Restart dev server after env changes
- Check Firebase Console → Project settings for correct values

### "Unauthorized Domain" (Firebase)
**Cause**: Domain not authorized in Firebase

**Solution**:
1. Firebase Console → Authentication → Settings → Authorized domains
2. Add `localhost` for development
3. Add production domain for deployment

### Database Connection Errors
**Cause**: DATABASE_URL incorrect or database not running

**Solution** (Local):
```bash
# PGlite should auto-start with npm run dev
npm run dev:simple
```

**Solution** (Production):
- Verify Neon DATABASE_URL is correct
- Check Neon dashboard for connection issues
- Ensure `?sslmode=require` is in URL

### GCS Upload Fails
**Cause**: Service account permissions or invalid credentials

**Solution**:
- Verify service account has "Storage Admin" role
- Check `GCS_PRIVATE_KEY` format (must include `\n` within quotes)
- Ensure bucket name is correct
- Check GCS bucket CORS configuration

### Deepgram Transcription Fails
**Cause**: Invalid API key or insufficient credits

**Solution**:
- Verify API key in Deepgram Console
- Check credit balance
- Test with curl (see Deepgram setup)
- Check audio file format (supported: WAV, MP3, FLAC, OGG)

### OpenAI API Errors
**Cause**: Invalid key, insufficient credits, or rate limits

**Solution**:
- Verify API key starts with `sk-proj-`
- Check billing in OpenAI dashboard
- Add payment method
- Set usage limits
- Check rate limit errors (wait and retry)

### PostHog Not Tracking Events
**Cause**: Incorrect host or key

**Solution**:
- Verify `NEXT_PUBLIC_POSTHOG_HOST` matches your region
- US: `https://us.i.posthog.com`
- EU: `https://eu.i.posthog.com`
- Check browser console for PostHog errors
- Disable ad blockers for testing

### Sentry Not Receiving Errors
**Cause**: DSN incorrect or not configured

**Solution**:
- Verify `NEXT_PUBLIC_SENTRY_DSN` is correct
- Check Sentry project is active
- Trigger test error:
  ```javascript
  throw new Error('Sentry test');
  ```
- Check browser console for Sentry init messages

---

## Cost Estimates

### Development (Monthly)
- Firebase: Free (Spark plan)
- Neon: Free (Hobby tier, 500MB)
- GCS: ~$1-5 (storage + bandwidth)
- Deepgram: Free ($200 credits)
- OpenAI: $10-50 (depending on usage)
- Arcjet: Free (100k requests)
- Sentry: Free (5k errors)
- PostHog: Free (1M events)
- Better Stack: Free (1GB logs)
- Checkly: Free (10 checks)

**Total: ~$10-60/month**

### Production (1,000 active users)
- Firebase: $25/month (Blaze plan)
- Neon: $19/month (Pro tier, 10GB)
- GCS: $10-50/month
- Deepgram: $50-200/month
- OpenAI: $100-500/month
- Arcjet: $20/month
- Sentry: $26/month
- PostHog: $0-50/month
- Better Stack: $20/month
- Checkly: $20/month
- Vercel: $20/month (Pro)

**Total: ~$300-900/month**

---

## Security Checklist

- [ ] `.env.local` added to `.gitignore`
- [ ] Service account JSON files not committed
- [ ] Production secrets stored in Vercel (not in code)
- [ ] Firebase authorized domains configured
- [ ] GCS buckets not publicly accessible
- [ ] API rate limiting enabled (Arcjet)
- [ ] CORS configured properly
- [ ] Authentication required for sensitive routes
- [ ] Environment-specific configs (dev vs prod)

---

## Next Steps

1. **Complete all setups above**
2. **Test each service individually**
3. **Run through full user flow**
4. **Set up CI/CD pipeline**
5. **Configure staging environment**
6. **Set up backup strategy**
7. **Document team workflows**
8. **Plan for scaling**

---

## Support & Resources

### Official Documentation
- [Firebase Docs](https://firebase.google.com/docs)
- [Neon Docs](https://neon.tech/docs)
- [Deepgram Docs](https://developers.deepgram.com/)
- [OpenAI Docs](https://platform.openai.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

### Community Support
- [Next.js Discord](https://nextjs.org/discord)
- [Firebase Community](https://firebase.google.com/community)
- [Stack Overflow](https://stackoverflow.com/)

### Need Help?
- Check troubleshooting section above
- Review service status pages
- Check Slack/Discord channels
- Open GitHub issue

---

**Last Updated**: 2025-10-30
**Version**: 1.0
**Maintained By**: Development Team

**Estimated Setup Time by Section**:
- Firebase: 20-30 min
- Database: 10 min (local) / 15 min (production)
- GCS: 15-20 min
- Deepgram: 5-10 min
- OpenAI: 5-10 min
- Arcjet: 5 min
- Monitoring (all): 30-45 min

**Total**: 1.5 - 2.5 hours
