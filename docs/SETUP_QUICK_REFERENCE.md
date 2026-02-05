# Setup Quick Reference

Quick links to all setup documentation for StoryCare.

## 📚 Documentation Index

### Getting Started
- **[GETTING_STARTED.md](./GETTING_STARTED.md)** ⭐
  - Start here if you're new
  - 30-minute quick setup
  - Covers Firebase + Database + First run

### Complete Setup Guides
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)**
  - Complete setup for all 10+ services
  - Firebase, Deepgram, OpenAI, GCS, Sentry, PostHog, etc.
  - Production deployment
  - Cost estimates

### Service-Specific Guides
- **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)**
  - Detailed Firebase Authentication setup
  - Client + Admin SDK
  - Code examples

- **[FIREBASE_ADMIN_CREDENTIALS.md](./FIREBASE_ADMIN_CREDENTIALS.md)** 🔑
  - Visual guide to get Firebase Admin credentials
  - Where to find FIREBASE_PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY
  - Common mistakes to avoid

- **[GCS_SETUP.md](./GCS_SETUP.md)** ☁️
  - Google Cloud Storage setup
  - Service account creation
  - File upload implementation
  - CORS configuration

- **[DATABASE_GUIDE.md](./DATABASE_GUIDE.md)**
  - Database schema overview
  - Drizzle ORM usage
  - Migrations workflow
  - Common database operations

### Architecture & Guidelines
- **[CLAUDE.md](./CLAUDE.md)**
  - Full project architecture
  - Tech stack decisions
  - Code patterns
  - Development workflows

---

## 🚀 Quick Start Steps

```bash
# 1. Install dependencies
npm install

# 2. Setup Firebase (15 min)
# Follow: FIREBASE_SETUP.md or FIREBASE_ADMIN_CREDENTIALS.md

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with Firebase credentials

# 4. Run migrations
npm run db:migrate

# 5. Start dev server
npm run dev:simple
```

---

## 📋 Setup Checklist

### Minimum Required (to run locally)
- [ ] Firebase Authentication setup
- [ ] `.env.local` with Firebase credentials
- [ ] Database migrations run
- [ ] Dev server starts

### Optional Services (for full features)
- [ ] Google Cloud Storage (file uploads)
- [ ] Deepgram API (transcription)
- [ ] OpenAI API (AI generation)
- [ ] Sentry (error tracking)
- [ ] PostHog (analytics)

### Production Ready
- [ ] All services configured
- [ ] Production buckets/databases created
- [ ] Environment variables in Vercel
- [ ] Domain authorized in Firebase
- [ ] Security review completed

---

## 🔑 Required Credentials

### Firebase (Required)
```bash
# Client (from Firebase Console → Project settings → Your apps)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Admin (from Service accounts → Generate private key)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

**Guide**: [FIREBASE_ADMIN_CREDENTIALS.md](./FIREBASE_ADMIN_CREDENTIALS.md)

### Database (Required)
```bash
# Local (default - auto-starts with npm run dev)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres

# Production (from Neon Console)
# DATABASE_URL=postgresql://user:pass@ep-xyz.neon.tech/db?sslmode=require
```

**Guide**: [DATABASE_GUIDE.md](./DATABASE_GUIDE.md)

### Google Cloud Storage (Optional)
```bash
GCS_PROJECT_ID=
GCS_CLIENT_EMAIL=
GCS_PRIVATE_KEY=
GCS_BUCKET_NAME=
```

**Guide**: [GCS_SETUP.md](./GCS_SETUP.md)

### AI Services (Optional)
```bash
# Deepgram (speech-to-text)
DEEPGRAM_API_KEY=

# OpenAI (GPT-4, DALL-E)
OPENAI_API_KEY=
```

**Guide**: [SETUP_GUIDE.md](./SETUP_GUIDE.md)

---

## 🆘 Troubleshooting

### Dev server exits immediately
→ See [GETTING_STARTED.md#troubleshooting](./GETTING_STARTED.md#common-issues--solutions)

### Firebase authentication errors
→ See [FIREBASE_ADMIN_CREDENTIALS.md#troubleshooting](./FIREBASE_ADMIN_CREDENTIALS.md#troubleshooting)

### Database connection issues
→ See [DATABASE_GUIDE.md#troubleshooting](./DATABASE_GUIDE.md#troubleshooting)

### GCS upload fails
→ See [GCS_SETUP.md#troubleshooting](./GCS_SETUP.md#troubleshooting)

---

## 📖 Documentation by Role

### New Developer
1. [GETTING_STARTED.md](./GETTING_STARTED.md)
2. [FIREBASE_ADMIN_CREDENTIALS.md](./FIREBASE_ADMIN_CREDENTIALS.md)
3. [DATABASE_GUIDE.md](./DATABASE_GUIDE.md)
4. [CLAUDE.md](./CLAUDE.md)

### DevOps / Deployment
1. [SETUP_GUIDE.md](./SETUP_GUIDE.md)
2. [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
3. [GCS_SETUP.md](./GCS_SETUP.md)

### Working with Features
- Sessions & Transcripts → [DATABASE_GUIDE.md](./DATABASE_GUIDE.md)
- File Uploads → [GCS_SETUP.md](./GCS_SETUP.md)
- Authentication → [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
- Architecture → [CLAUDE.md](./CLAUDE.md)

---

## ⏱️ Time Estimates

| Task | Time Required |
|------|---------------|
| Firebase setup | 15-20 min |
| Database setup (local) | 5 min |
| GCS setup | 20 min |
| Deepgram setup | 5 min |
| OpenAI setup | 5 min |
| First local run | 30 min total |
| Full production setup | 2-3 hours |

---

## 📞 Getting Help

### Documentation
- Start with [GETTING_STARTED.md](./GETTING_STARTED.md)
- Check troubleshooting sections in each guide
- Review [CLAUDE.md](./CLAUDE.md) for architecture

### External Resources
- [Next.js Docs](https://nextjs.org/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [DrizzleORM Docs](https://orm.drizzle.team/docs/overview)

---

**Last Updated**: 2025-10-30
