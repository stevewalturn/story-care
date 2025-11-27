# StoryCare - Google Cloud Run Deployment Guide

Complete guide for deploying the StoryCare application to Google Cloud Run with automated deployments.

## Quick Links
- **[GitHub Actions Setup](./GITHUB_ACTIONS_SETUP.md)** - Deploy via GitHub Actions (Recommended)
- **[Quick Start Guide](./DEPLOY_QUICKSTART.md)** - Common commands reference
- **[Database Setup - Cloud SQL](./SETUP_DATABASE_CLOUD_SQL.md)** - Set up Google Cloud SQL PostgreSQL (Recommended)
- **[Database Setup - Neon](./SETUP_DATABASE.md)** - Alternative: Set up Neon PostgreSQL
- **[Firebase Setup](./SETUP_FIREBASE.md)** - Configure Firebase Authentication

## Table of Contents
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Environment Variables](#environment-variables)
- [Deployment Options](#deployment-options)
- [Configuration](#configuration)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1. Google Cloud Account Setup
- Google Cloud Platform account
- Billing enabled
- Project created (or create new one)

### 2. Install Required Tools

**Google Cloud SDK:**
```bash
# Install gcloud CLI
# macOS
brew install --cask google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash

# Windows
# Download from https://cloud.google.com/sdk/docs/install

# Verify installation
gcloud --version
```

**Docker (for local testing):**
```bash
# macOS
brew install docker

# Or download Docker Desktop from https://www.docker.com/products/docker-desktop
```

### 3. Authenticate with Google Cloud

```bash
# Login to Google Cloud
gcloud auth login

# Set your project ID (replace YOUR_PROJECT_ID)
gcloud config set project YOUR_PROJECT_ID

# Verify configuration
gcloud config list
```

---

## Initial Setup

### Step 1: Enable Required APIs

```bash
# Enable all required Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  containerregistry.googleapis.com \
  artifactregistry.googleapis.com
```

### Step 2: Get Your Project Number

You'll need this for IAM permissions:

```bash
# Get your project number
gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)"

# Save this number - you'll use it as PROJECT_NUMBER below
```

### Step 3: Grant IAM Permissions

**Cloud Build Service Account:**
```bash
# Replace PROJECT_NUMBER with the number from Step 2
export PROJECT_NUMBER=YOUR_PROJECT_NUMBER

# Grant Secret Manager access to Cloud Build
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor

# Grant Cloud Run Admin to Cloud Build (for deployments)
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
  --role=roles/run.admin

# Grant Service Account User role
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
  --role=roles/iam.serviceAccountUser
```

**Cloud Run Service Account:**
```bash
# Grant Secret Manager access to Cloud Run
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member=serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

---

## Environment Variables

### Option 1: Automated Setup (Recommended)

Use the provided script to set up all secrets:

```bash
# Make the script executable
chmod +x scripts/setup-gcp-secrets.sh

# Run the setup script
./scripts/setup-gcp-secrets.sh
```

The script will prompt you for each environment variable and create/update secrets in Google Cloud Secret Manager.

### Option 2: Manual Setup

Create secrets individually:

```bash
# Example: Create a secret
echo -n "your-secret-value" | gcloud secrets create SECRET_NAME \
  --data-file=- \
  --replication-policy="automatic"

# Example: Update an existing secret
echo -n "new-value" | gcloud secrets versions add SECRET_NAME \
  --data-file=-
```

### Required Secrets

**Firebase Authentication (Client):**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

**Firebase Admin SDK (Server):**
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (include newlines as `\n`)

**Database:**
- `DATABASE_URL` (Neon PostgreSQL connection string)

**Google Cloud Storage:**
- `GCS_PROJECT_ID`
- `GCS_CLIENT_EMAIL`
- `GCS_PRIVATE_KEY` (include newlines as `\n`)
- `GCS_BUCKET_NAME`

**AI Services (Optional):**
- `DEEPGRAM_API_KEY` (transcription)
- `OPENAI_API_KEY` (GPT models)
- `SUNO_API_KEY` (music generation)
- `ATLASCLOUD_API_KEY` (image/video generation)
- `GOOGLE_VERTEX_PROJECT_ID` (Gemini models)
- `GOOGLE_VERTEX_LOCATION` (default: us-central1)
- `STABILITY_API_KEY` (Stable Diffusion)
- `FLUX_API_KEY` (Flux models)
- `REPLICATE_API_TOKEN` (Replicate models)

**Security:**
- `ARCJET_KEY`

**Application:**
- `NEXT_PUBLIC_APP_URL` (your Cloud Run URL)

**Monitoring (Optional):**
- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`
- `NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN`

---

## Deployment Options

### Option A: GitHub Actions (Recommended)

Deploy automatically when you push to `main` branch. See **[GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md)** for complete setup instructions.

**Pros:**
- ✅ Better integration with GitHub workflow
- ✅ Visible in GitHub Actions tab
- ✅ 2,000 free minutes/month
- ✅ Easy to configure secrets

**Quick Setup:**
1. Add secrets to GitHub repository settings
2. Push to main branch
3. Watch deployment in Actions tab

---

### Option B: Cloud Build

Alternative automated deployment using Google Cloud Build.

**Pros:**
- ✅ Integrated with GCP
- ✅ 120 free build-minutes/day
- ✅ No GitHub secrets needed (uses GCP Secret Manager)

**Use when:** You prefer GCP-centric tooling

#### 1. Connect GitHub Repository

1. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
2. Click **"Connect Repository"**
3. Select **GitHub** as the source
4. Authenticate with GitHub
5. Select your repository: `walturn/story-care`
6. Click **"Connect"**

#### 2. Create Build Trigger

1. Click **"Create Trigger"**
2. Configure:
   - **Name:** `storycare-deploy-main`
   - **Event:** Push to a branch
   - **Source:** `^main$` (regex for main branch)
   - **Configuration:** Cloud Build configuration file (yaml or json)
   - **Location:** Repository
   - **Cloud Build configuration file:** `cloudbuild.yaml`
3. Click **"Create"**

#### 3. Deploy

Simply push to main:

```bash
git add .
git commit -m "feat: deploy to Cloud Run"
git push origin main
```

Cloud Build will automatically:
1. Build the Docker image
2. Push to Container Registry
3. Deploy to Cloud Run
4. Inject environment variables from Secret Manager

#### 4. Monitor Build

```bash
# View recent builds
gcloud builds list --limit=5

# Stream logs for a specific build
gcloud builds log BUILD_ID --stream
```

Or view in [Cloud Build Console](https://console.cloud.google.com/cloud-build/builds).

---

### Option C: Manual Deployment via gcloud CLI

For manual deployments or testing:

#### 1. Build Docker Image Locally

```bash
# Build the image
docker build -t gcr.io/$(gcloud config get-value project)/storycare-app:latest .

# Test locally (optional)
docker run -p 8080:8080 --env-file .env.local gcr.io/$(gcloud config get-value project)/storycare-app:latest
```

#### 2. Push to Container Registry

```bash
# Configure Docker to use gcloud as credential helper
gcloud auth configure-docker

# Push the image
docker push gcr.io/$(gcloud config get-value project)/storycare-app:latest
```

#### 3. Deploy to Cloud Run

```bash
gcloud run deploy storycare-app \
  --image gcr.io/$(gcloud config get-value project)/storycare-app:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 4Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0 \
  --port 8080 \
  --set-env-vars NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1,PORT=8080 \
  --update-secrets DATABASE_URL=DATABASE_URL:latest,FIREBASE_PROJECT_ID=FIREBASE_PROJECT_ID:latest,FIREBASE_CLIENT_EMAIL=FIREBASE_CLIENT_EMAIL:latest,FIREBASE_PRIVATE_KEY=FIREBASE_PRIVATE_KEY:latest,GCS_PROJECT_ID=GCS_PROJECT_ID:latest,GCS_CLIENT_EMAIL=GCS_CLIENT_EMAIL:latest,GCS_PRIVATE_KEY=GCS_PRIVATE_KEY:latest,GCS_BUCKET_NAME=GCS_BUCKET_NAME:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest,DEEPGRAM_API_KEY=DEEPGRAM_API_KEY:latest,ARCJET_KEY=ARCJET_KEY:latest,NEXT_PUBLIC_FIREBASE_API_KEY=NEXT_PUBLIC_FIREBASE_API_KEY:latest,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:latest,NEXT_PUBLIC_FIREBASE_PROJECT_ID=NEXT_PUBLIC_FIREBASE_PROJECT_ID:latest,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:latest,NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:latest,NEXT_PUBLIC_FIREBASE_APP_ID=NEXT_PUBLIC_FIREBASE_APP_ID:latest,NEXT_PUBLIC_APP_URL=NEXT_PUBLIC_APP_URL:latest
```

#### 4. Get Service URL

```bash
gcloud run services describe storycare-app \
  --region us-central1 \
  --format 'value(status.url)'
```

---

## Configuration

### Cloud Run Service Configuration

The application is configured with the following Cloud Run settings:

- **Region:** us-central1 (Iowa)
- **Memory:** 4 GiB
- **CPU:** 2 vCPU
- **Request Timeout:** 300 seconds (5 minutes)
- **Max Instances:** 10
- **Min Instances:** 0 (scale to zero for cost savings)
- **Concurrency:** 80 (default)
- **Port:** 8080

### Customize Configuration

To change these settings, modify `cloudbuild.yaml`:

```yaml
# In the deploy step, update these flags:
- '--memory'
- '8Gi'  # Change memory
- '--cpu'
- '4'    # Change CPU
- '--max-instances'
- '20'   # Change max instances
```

### Database Connection Pooling

The app is configured for Cloud Run's scale-to-zero behavior:

- **Max Connections:** 10 (production)
- **Connection Timeout:** 30 seconds
- **Idle Timeout:** 30 seconds
- **Allow Exit on Idle:** true

These settings are in `src/utils/DBConnection.ts`.

---

## Monitoring

### View Logs

```bash
# Stream logs
gcloud run services logs tail storycare-app --region us-central1

# View recent logs
gcloud run services logs read storycare-app --region us-central1 --limit 50
```

Or view in [Cloud Run Console](https://console.cloud.google.com/run).

### Health Check

The application includes a health check endpoint:

```bash
# Check health
curl https://YOUR_CLOUD_RUN_URL/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 123.45,
  "database": "connected",
  "responseTime": "12ms",
  "environment": "production"
}
```

### Metrics

View metrics in [Cloud Run Console](https://console.cloud.google.com/run):
- Request count
- Request latency
- Container CPU/Memory utilization
- Billable container time

### Alerts (Optional)

Set up alerts for:
- Error rate > 5%
- Response time > 2 seconds
- Memory utilization > 80%

---

## Troubleshooting

### Build Failures

**Error: "Secret not found"**
```bash
# Verify secret exists
gcloud secrets list

# Create missing secret
echo -n "value" | gcloud secrets create SECRET_NAME --data-file=-
```

**Error: "Permission denied"**
```bash
# Verify Cloud Build has permissions
gcloud projects get-iam-policy $(gcloud config get-value project) \
  --flatten="bindings[].members" \
  --format="table(bindings.role)" \
  --filter="bindings.members:*@cloudbuild.gserviceaccount.com"

# Should include:
# - roles/secretmanager.secretAccessor
# - roles/run.admin
# - roles/iam.serviceAccountUser
```

### Deployment Failures

**Error: "Database connection failed"**
- Verify `DATABASE_URL` is correct in Secret Manager
- Check Neon database is accessible from Cloud Run
- Ensure database allows connections from `0.0.0.0/0` or Cloud Run IPs

**Error: "Module not found"**
- Ensure all dependencies are in `package.json`
- Check that `npm ci` runs successfully in Dockerfile
- Verify Next.js standalone mode includes all required files

### Runtime Errors

**Error: "Firebase authentication failed"**
- Verify Firebase credentials in Secret Manager
- Ensure private keys have proper newlines (`\n`)
- Check Firebase project settings

**Error: "Container startup timeout"**
- Increase container startup timeout:
  ```bash
  gcloud run services update storycare-app \
    --region us-central1 \
    --timeout 600
  ```

**Error: "Out of memory"**
- Increase memory allocation:
  ```bash
  gcloud run services update storycare-app \
    --region us-central1 \
    --memory 8Gi
  ```

### View Detailed Logs

```bash
# Filter error logs
gcloud run services logs read storycare-app \
  --region us-central1 \
  --filter "severity>=ERROR" \
  --limit 50

# Filter by time
gcloud run services logs read storycare-app \
  --region us-central1 \
  --filter "timestamp>=\"2025-01-15T10:00:00Z\"" \
  --limit 50
```

### Database Migration Issues

**Error: "Migration failed during build"**
```bash
# Run migrations manually
# 1. Connect to Cloud SQL proxy or run locally with production DATABASE_URL
npm run db:migrate

# 2. Verify migrations
gcloud run services logs read storycare-app \
  --region us-central1 \
  --filter "textPayload:migration"
```

### Cost Optimization

Monitor your costs:
```bash
# View Cloud Run billing
gcloud billing accounts list

# Check current month usage
gcloud run services describe storycare-app \
  --region us-central1 \
  --format="value(status.observedGeneration)"
```

**Reduce costs:**
- Set `--min-instances=0` (scale to zero)
- Lower `--max-instances` if traffic is low
- Reduce `--cpu` and `--memory` if not needed
- Enable request timeout to kill long-running requests

---

## Next Steps

After successful deployment:

1. **Update Firebase Authorized Domains:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Project Settings > Authorized domains
   - Add your Cloud Run URL

2. **Configure Custom Domain (Optional):**
   ```bash
   gcloud run domain-mappings create \
     --service storycare-app \
     --domain your-domain.com \
     --region us-central1
   ```

3. **Set up CI/CD:**
   - Already configured with Cloud Build!
   - Push to `main` branch to auto-deploy

4. **Enable HTTPS:**
   - Cloud Run automatically provisions SSL certificates
   - All traffic is HTTPS by default

5. **Configure CORS (if needed):**
   - Update Next.js middleware to allow your domain

6. **Set up Monitoring:**
   - Enable Cloud Monitoring
   - Set up error alerting
   - Configure uptime checks

---

## Additional Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Firebase Console](https://console.firebase.google.com/)
- [Neon Database](https://console.neon.tech/)

---

## Support

For issues or questions:
- Check [Troubleshooting](#troubleshooting) section above
- Review Cloud Run logs
- Consult CLAUDE.md for application-specific details
- Review PRD.md for feature specifications

---

**Last Updated:** 2025-01-15
**Version:** 1.0.0
