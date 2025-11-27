# Dev & Production Deployment Guide

This guide explains how to set up separate development and production deployments to Google Cloud Run using GitHub Actions.

## 🎯 Overview

You now have **two separate deployment workflows**:

| Environment | Workflow File | Triggers On | Service Name | GitHub Secret |
|------------|--------------|-------------|--------------|---------------|
| **Development** | `deploy-dev.yml` | Push to `dev`, `develop`, or `feature/*` | `storycare-app-dev` | `ENV_FILE_DEV` |
| **Production** | `deploy-prod.yml` | Push to `main` | `storycare-app` | `ENV_FILE_PROD` |

### Key Benefits:
- ✅ **Separate environments** - Dev and prod are completely isolated
- ✅ **Different configs** - Use different Firebase projects, databases, API keys
- ✅ **Cost optimization** - Dev uses fewer resources (2Gi RAM, 1 CPU vs 4Gi RAM, 2 CPU)
- ✅ **Safe testing** - Test in dev before promoting to prod
- ✅ **Easy management** - Just push to the right branch

---

## 📋 Step 1: Prepare Your Environment Files

### Option A: Using .env.local for Both (Simplest)

If you're just getting started, use the same config for both dev and prod:

```bash
# Your existing .env.local will be used for both dev and prod
./create-env-for-github.sh
```

This creates:
- `.env.github.dev` - For development (from `.env.local`)
- `.env.github.prod` - For production (from `.env.local`)

### Option B: Separate Dev and Prod Configs (Recommended)

Create separate environment files for dev and prod:

**1. Create `.env.production` file:**
```bash
# Copy your .env.local as a starting point
cp .env.local .env.production

# Edit .env.production with production values
nano .env.production
```

**2. Update values in `.env.production`:**
```bash
# Production Firebase (different project)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza... # Production Firebase API key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=storycare-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=storycare-prod
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=storycare-prod.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=987654321
NEXT_PUBLIC_FIREBASE_APP_ID=1:987654321:web:xyz789

# Production Database
DATABASE_URL=postgresql://prod_user:prod_pass@prod-host.neon.tech/storycare_prod

# Production App URL (update after first deployment)
NEXT_PUBLIC_APP_URL=https://storycare-app-xyz-uc.a.run.app

# Production monitoring
NEXT_PUBLIC_SENTRY_DSN=https://prod-sentry-dsn...
NEXT_PUBLIC_POSTHOG_KEY=phc_prod_...
```

**3. Run the script:**
```bash
./create-env-for-github.sh
```

This creates:
- `.env.github.dev` - For development (from `.env.local`)
- `.env.github.prod` - For production (from `.env.production`)

---

## 🔑 Step 2: Add GitHub Secrets

Go to: **https://github.com/akbar904/story-care/settings/secrets/actions**

### Required Secrets (All Environments):

| Secret Name | Value | Description |
|------------|-------|-------------|
| `GCP_PROJECT_ID` | `storycare-478114` | Your GCP project ID |
| `WIF_PROVIDER` | `projects/832961952490/...` | Workload Identity Provider |
| `WIF_SERVICE_ACCOUNT` | `github-actions@storycare-478114.iam.gserviceaccount.com` | Service account email |
| `ENV_FILE_DEV` | Contents of `.env.github.dev` | Dev environment variables |
| `ENV_FILE_PROD` | Contents of `.env.github.prod` | Prod environment variables |

**Total: Just 5 secrets!** 🎉

---

## 🚀 Step 3: Set Up Branch Structure

### Recommended Git Workflow:

```
main (production)
  ↑
  | merge when ready
  |
dev (development)
  ↑
  | merge after testing
  |
feature/* (feature branches)
```

### Create Dev Branch:

```bash
# Create and push dev branch
git checkout -b dev
git push -u origin dev
```

---

## 📦 Step 4: Deploy to Development

Push to `dev`, `develop`, or `feature/*` branches:

```bash
# Make changes
git checkout dev
# ... make your changes ...

# Commit and push
git add .
git commit -m "feat: add new feature"
git push origin dev
```

GitHub Actions will automatically:
1. ✅ Build Docker image with `ENV_FILE_DEV`
2. ✅ Deploy to `storycare-app-dev` service
3. ✅ Run health checks
4. ✅ Show deployment URL

Watch the deployment:
**https://github.com/akbar904/story-care/actions**

---

## 🎯 Step 5: Deploy to Production

After testing in dev, merge to main:

```bash
# Switch to main
git checkout main

# Merge dev branch
git merge dev

# Push to trigger production deployment
git push origin main
```

GitHub Actions will automatically:
1. ✅ Build Docker image with `ENV_FILE_PROD`
2. ✅ Deploy to `storycare-app` service (production)
3. ✅ Run health checks
4. ✅ Show deployment URL

---

## 🔍 Workflow Comparison

### Development Workflow (`deploy-dev.yml`)

```yaml
Triggers: dev, develop, feature/* branches
Service: storycare-app-dev
Resources:
  - Memory: 2Gi
  - CPU: 1
  - Max instances: 5
  - Min instances: 0
Environment: development
Secrets: ENV_FILE_DEV
GCP Secrets: *_DEV variants
```

### Production Workflow (`deploy-prod.yml`)

```yaml
Triggers: main branch, v*.*.* tags
Service: storycare-app
Resources:
  - Memory: 4Gi
  - CPU: 2
  - Max instances: 10
  - Min instances: 1 (always warm)
Environment: production
Secrets: ENV_FILE_PROD
GCP Secrets: Production secrets
```

---

## 🔐 GCP Secret Manager Setup

You need **separate secrets** in GCP Secret Manager for dev and prod:

### Development Secrets (in GCP Secret Manager):

```bash
# Create dev database URL
echo -n "postgresql://dev_user:pass@dev-host/storycare_dev" | \
  gcloud secrets create DATABASE_URL_DEV --data-file=-

# Create dev Firebase credentials
gcloud secrets create FIREBASE_PROJECT_ID_DEV --data-file=<(echo -n "storycare-dev")
gcloud secrets create FIREBASE_CLIENT_EMAIL_DEV --data-file=<(echo -n "firebase-adminsdk-dev@storycare-dev.iam.gserviceaccount.com")
gcloud secrets create FIREBASE_PRIVATE_KEY_DEV --data-file=firebase-dev-key.json

# Create dev GCS bucket name
gcloud secrets create GCS_BUCKET_NAME_DEV --data-file=<(echo -n "storycare-dev-media")

# Public Firebase config (dev)
gcloud secrets create NEXT_PUBLIC_FIREBASE_API_KEY_DEV --data-file=<(echo -n "AIza...")
gcloud secrets create NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_DEV --data-file=<(echo -n "storycare-dev.firebaseapp.com")
gcloud secrets create NEXT_PUBLIC_FIREBASE_PROJECT_ID_DEV --data-file=<(echo -n "storycare-dev")
gcloud secrets create NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_DEV --data-file=<(echo -n "storycare-dev.appspot.com")
gcloud secrets create NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_DEV --data-file=<(echo -n "123456789")
gcloud secrets create NEXT_PUBLIC_FIREBASE_APP_ID_DEV --data-file=<(echo -n "1:123456789:web:abc123")
gcloud secrets create NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID_DEV --data-file=<(echo -n "G-ABC123")
gcloud secrets create NEXT_PUBLIC_APP_URL_DEV --data-file=<(echo -n "https://storycare-app-dev-xyz.run.app")
gcloud secrets create NEXT_PUBLIC_SENTRY_DSN_DEV --data-file=<(echo -n "https://dev-sentry...")
gcloud secrets create NEXT_PUBLIC_POSTHOG_KEY_DEV --data-file=<(echo -n "phc_dev_...")
```

### Production Secrets (in GCP Secret Manager):

```bash
# Create prod database URL
echo -n "postgresql://prod_user:pass@prod-host/storycare_prod" | \
  gcloud secrets create DATABASE_URL --data-file=-

# Create prod Firebase credentials
gcloud secrets create FIREBASE_PROJECT_ID --data-file=<(echo -n "storycare-prod")
gcloud secrets create FIREBASE_CLIENT_EMAIL --data-file=<(echo -n "firebase-adminsdk@storycare-prod.iam.gserviceaccount.com")
gcloud secrets create FIREBASE_PRIVATE_KEY --data-file=firebase-prod-key.json

# Create prod GCS bucket name
gcloud secrets create GCS_BUCKET_NAME --data-file=<(echo -n "storycare-prod-media")

# Public Firebase config (prod)
gcloud secrets create NEXT_PUBLIC_FIREBASE_API_KEY --data-file=<(echo -n "AIza...")
gcloud secrets create NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN --data-file=<(echo -n "storycare.firebaseapp.com")
gcloud secrets create NEXT_PUBLIC_FIREBASE_PROJECT_ID --data-file=<(echo -n "storycare-prod")
gcloud secrets create NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET --data-file=<(echo -n "storycare.appspot.com")
gcloud secrets create NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --data-file=<(echo -n "987654321")
gcloud secrets create NEXT_PUBLIC_FIREBASE_APP_ID --data-file=<(echo -n "1:987654321:web:xyz789")
gcloud secrets create NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID --data-file=<(echo -n "G-XYZ789")
gcloud secrets create NEXT_PUBLIC_APP_URL --data-file=<(echo -n "https://storycare-app-xyz.run.app")
gcloud secrets create NEXT_PUBLIC_SENTRY_DSN --data-file=<(echo -n "https://prod-sentry...")
gcloud secrets create NEXT_PUBLIC_POSTHOG_KEY --data-file=<(echo -n "phc_prod_...")
```

### Shared Secrets (Same for Dev and Prod):

```bash
# API keys (can be shared or separate)
gcloud secrets create DEEPGRAM_API_KEY --data-file=<(echo -n "your_deepgram_key")
gcloud secrets create OPENAI_API_KEY --data-file=<(echo -n "your_openai_key")
gcloud secrets create STABILITY_API_KEY --data-file=<(echo -n "your_stability_key")
gcloud secrets create ARCJET_KEY --data-file=<(echo -n "your_arcjet_key")
gcloud secrets create NEXT_PUBLIC_POSTHOG_HOST --data-file=<(echo -n "https://app.posthog.com")

# GCS credentials (can be shared)
gcloud secrets create GCS_PROJECT_ID --data-file=<(echo -n "storycare-478114")
gcloud secrets create GCS_CLIENT_EMAIL --data-file=<(echo -n "gcs-service-account@storycare-478114.iam.gserviceaccount.com")
gcloud secrets create GCS_PRIVATE_KEY --data-file=gcs-key.json

# Google Vertex AI
gcloud secrets create GOOGLE_VERTEX_PROJECT_ID --data-file=<(echo -n "storycare-478114")
gcloud secrets create GOOGLE_VERTEX_LOCATION --data-file=<(echo -n "us-central1")
```

---

## 🧪 Testing Workflow

### 1. Develop on Feature Branch

```bash
git checkout -b feature/new-auth-flow
# ... make changes ...
git push origin feature/new-auth-flow
```

This automatically deploys to **dev environment** (`storycare-app-dev`)

### 2. Test in Dev

Visit: `https://storycare-app-dev-[hash]-uc.a.run.app`

### 3. Merge to Dev Branch

```bash
git checkout dev
git merge feature/new-auth-flow
git push origin dev
```

### 4. Final Testing

Test again on dev environment with integrated features

### 5. Promote to Production

```bash
git checkout main
git merge dev
git push origin main
```

This automatically deploys to **production** (`storycare-app`)

---

## 📊 Monitoring Deployments

### View Deployment Logs:

**Development:**
https://github.com/akbar904/story-care/actions?query=workflow%3A%22Deploy+to+Cloud+Run+%28Dev%29%22

**Production:**
https://github.com/akbar904/story-care/actions?query=workflow%3A%22Deploy+to+Cloud+Run+%28Production%29%22

### Check Cloud Run Services:

```bash
# List all services
gcloud run services list --platform=managed --region=us-central1

# Get dev service URL
gcloud run services describe storycare-app-dev --platform=managed --region=us-central1 --format="value(status.url)"

# Get prod service URL
gcloud run services describe storycare-app --platform=managed --region=us-central1 --format="value(status.url)"
```

---

## 🔄 Updating Environment Variables

### To Update Dev Environment:

1. Edit `.env.local`
2. Run `./create-env-for-github.sh`
3. Copy the DEV output to GitHub Secret `ENV_FILE_DEV`
4. Push to `dev` branch to trigger redeployment

### To Update Production Environment:

1. Edit `.env.production`
2. Run `./create-env-for-github.sh`
3. Copy the PROD output to GitHub Secret `ENV_FILE_PROD`
4. Push to `main` branch to trigger redeployment

---

## 🚨 Troubleshooting

### Deployment Failed in Dev but Not Prod

**Problem:** Different configurations causing issues.

**Solution:**
```bash
# Compare env files
diff .env.github.dev .env.github.prod
```

### Need to Rollback Production

**Problem:** Bad deployment to production.

**Solution:**
```bash
# Rollback to previous revision
gcloud run services update-traffic storycare-app \
  --to-revisions=PREVIOUS_REVISION=100 \
  --platform=managed \
  --region=us-central1
```

### Want to Deploy Prod Manually

**Problem:** Need to trigger prod deployment without pushing to main.

**Solution:**
1. Go to: https://github.com/akbar904/story-care/actions
2. Click "Deploy to Cloud Run (Production)"
3. Click "Run workflow"
4. Select `main` branch
5. Click "Run workflow" button

---

## 🎯 Best Practices

1. **Always test in dev first** before promoting to prod
2. **Use separate Firebase projects** for dev and prod
3. **Use separate databases** (Neon allows multiple databases)
4. **Monitor both environments** with Sentry and PostHog
5. **Set up GitHub branch protection** for main branch (require PR reviews)
6. **Use environment protection rules** in GitHub to require approval for prod deployments

---

## 📚 Quick Reference

### Branch → Deployment Mapping

| Branch | Deploys To | Service Name | GitHub Secret |
|--------|-----------|--------------|---------------|
| `feature/*` | Development | `storycare-app-dev` | `ENV_FILE_DEV` |
| `dev` | Development | `storycare-app-dev` | `ENV_FILE_DEV` |
| `develop` | Development | `storycare-app-dev` | `ENV_FILE_DEV` |
| `main` | Production | `storycare-app` | `ENV_FILE_PROD` |

### Service URLs

After first deployment, update these in your env files:

**Dev:**
```bash
NEXT_PUBLIC_APP_URL=https://storycare-app-dev-[hash]-uc.a.run.app
```

**Prod:**
```bash
NEXT_PUBLIC_APP_URL=https://storycare-app-[hash]-uc.a.run.app
```

---

**Last Updated:** 2025-01-15
**Repository:** akbar904/story-care
**Project ID:** storycare-478114
