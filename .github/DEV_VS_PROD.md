# Development vs Production: Configuration Reference

Quick reference guide showing the differences between dev and prod environments.

---

## GitHub Secrets

| Secret Name | Development | Production |
|------------|-------------|------------|
| **Project ID** | `GCP_PROJECT_ID_DEV`<br/>`storycare-dev-479511` | `GCP_PROJECT_ID_PROD`<br/>`storycare-prod-XXXXXX` |
| **WIF Provider** | `GCP_WORKLOAD_IDENTITY_PROVIDER_DEV`<br/>`projects/780029180736/locations/global/workloadIdentityPools/github-dev/providers/github-dev-provider` | `GCP_WORKLOAD_IDENTITY_PROVIDER_PROD`<br/>`projects/YOUR_NUMBER/locations/global/workloadIdentityPools/github-prod/providers/github-prod-provider` |
| **Service Account** | `GCP_SERVICE_ACCOUNT_DEV`<br/>`github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com` | `GCP_SERVICE_ACCOUNT_PROD`<br/>`github-actions-prod@storycare-prod-XXXXXX.iam.gserviceaccount.com` |
| **Env File** | `ENV_FILE_DEV` | `ENV_FILE_PROD` |

---

## GCP Secret Manager Secrets

| Secret Name | Development | Production |
|------------|-------------|------------|
| **Database URL** | `DATABASE_URL_DEV`<br/>`postgresql://postgres:PASSWORD@/storycare_dev?host=/cloudsql/storycare-478114:us-central1:storycare-dev` | `DATABASE_URL`<br/>`postgresql://postgres:PASSWORD@/storycare_prod?host=/cloudsql/YOUR_CONNECTION_NAME` |

---

## Cloud SQL Configuration

| Setting | Development | Production |
|---------|-------------|------------|
| **Instance Name** | `storycare-dev` | `storycare-prod` |
| **Project** | `storycare-478114` | `storycare-prod-XXXXXX` |
| **Connection Name** | `storycare-478114:us-central1:storycare-dev` | `YOUR_PROJECT:us-central1:storycare-prod` |
| **Database** | `storycare_dev` | `storycare_prod` |
| **Tier** | Standard (cost-optimized) | Regional HA (high availability) |
| **Backups** | Daily | Daily + Point-in-time recovery |

---

## Cloud Run Configuration

| Setting | Development | Production |
|---------|-------------|------------|
| **Service Name** | `storycare-app-dev` | `storycare-app` |
| **Memory** | 2Gi | 4Gi |
| **CPU** | 1 | 2 |
| **Min Instances** | 0 (scales to zero) | 1 (always warm) |
| **Max Instances** | 5 | 100 |
| **Concurrency** | 80 | 80 |
| **Timeout** | 300s | 300s |
| **NODE_ENV** | `development` | `production` |

---

## Deployment Triggers

| Trigger | Development | Production |
|---------|-------------|------------|
| **Type** | Automatic on push | Manual only |
| **Branches** | `main` | N/A (manual trigger) |
| **Confirmation** | None | Must type "deploy" |
| **Environment** | `development` | N/A |

---

## Workflow Files

| File | Purpose | Trigger |
|------|---------|---------|
| `.github/workflows/deploy-dev.yml` | Deploy to dev | Push to `main` branch |
| `.github/workflows/deploy-prod.yml` | Deploy to prod | Manual workflow_dispatch |
| `.github/workflows/deploy-video-processor.yml` | Deploy video processor | Push to `main` branch |

---

## Service Accounts

### Development Service Account
```
github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com
```

**Roles:**
- `roles/run.admin` - Deploy Cloud Run services
- `roles/storage.admin` - Push to GCR
- `roles/iam.serviceAccountUser` - Act as other service accounts
- `roles/cloudsql.client` - Configure Cloud SQL connections
- `roles/secretmanager.secretAccessor` (on DATABASE_URL_DEV)

### Production Service Account
```
github-actions-prod@storycare-prod-XXXXXX.iam.gserviceaccount.com
```

**Roles:**
- `roles/run.admin` - Deploy Cloud Run services
- `roles/storage.admin` - Push to GCR
- `roles/iam.serviceAccountUser` - Act as other service accounts
- `roles/cloudsql.client` - Configure Cloud SQL connections
- `roles/secretmanager.secretAccessor` (on DATABASE_URL)

---

## Environment Variables

### Build-Time (from ENV_FILE)
These are baked into the Docker image:

```env
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_KEY=...

# GCS Configuration
GCS_PROJECT_ID=...
GCS_BUCKET_NAME=...
GCS_CLIENT_EMAIL=...
GCS_PRIVATE_KEY=...

# AI Services
DEEPGRAM_API_KEY=...
OPENAI_API_KEY=...

# Security
ARCJET_KEY=...

# App Config
NEXT_PUBLIC_APP_URL=...
NEXT_PUBLIC_APP_NAME=...
```

### Runtime (from GCP Secret Manager)
These are loaded at deployment time:

```bash
# Development
--update-secrets=DATABASE_URL=DATABASE_URL_DEV:latest

# Production
--update-secrets=DATABASE_URL=DATABASE_URL:latest
```

---

## Docker Image Tags

### Development
```bash
gcr.io/storycare-dev-479511/storycare-app-dev:${{ github.sha }}
gcr.io/storycare-dev-479511/storycare-app-dev:dev-latest
```

### Production
```bash
gcr.io/storycare-prod-XXXXXX/storycare-app:${{ github.sha }}
gcr.io/storycare-prod-XXXXXX/storycare-app:latest
gcr.io/storycare-prod-XXXXXX/storycare-app:prod-YYYYMMDD-HHMMSS
```

---

## Database Connection Strings

### Local Development (Both Environments)
```bash
# With Cloud SQL Proxy running
postgresql://postgres:PASSWORD@127.0.0.1:5432/DATABASE_NAME?sslmode=disable
```

### Cloud Run - Development
```bash
postgresql://postgres:I|0PRO]3ya4NC_B@/storycare_dev?host=/cloudsql/storycare-478114:us-central1:storycare-dev
```

### Cloud Run - Production
```bash
postgresql://postgres:YOUR_PROD_PASSWORD@/storycare_prod?host=/cloudsql/YOUR_PROJECT:us-central1:storycare-prod
```

---

## How to Deploy

### Development
```bash
# Automatic on push to main
git push origin main
```

### Production
1. Go to: https://github.com/YOUR_USERNAME/story-care/actions
2. Select "Deploy to Production"
3. Click "Run workflow"
4. Type `deploy` in the confirmation field
5. Click "Run workflow"

---

## Monitoring & Logs

### Development Logs
```bash
gcloud run services logs read storycare-app-dev \
  --region=us-central1 \
  --project=storycare-dev-479511 \
  --limit=100
```

### Production Logs
```bash
gcloud run services logs read storycare-app \
  --region=us-central1 \
  --project=storycare-prod-XXXXXX \
  --limit=100
```

---

## Quick Commands

### Connect to Development Database
```bash
# Using Cloud SQL Proxy
cloud_sql_proxy -instances=storycare-478114:us-central1:storycare-dev=tcp:5432

# Then connect
psql "postgresql://postgres:I|0PRO]3ya4NC_B@127.0.0.1:5432/storycare_dev?sslmode=disable"
```

### Connect to Production Database
```bash
# Using Cloud SQL Proxy
cloud_sql_proxy -instances=YOUR_PROJECT:us-central1:storycare-prod=tcp:5432

# Then connect
psql "postgresql://postgres:YOUR_PROD_PASSWORD@127.0.0.1:5432/storycare_prod?sslmode=disable"
```

### Update Development Secret
```bash
echo -n "NEW_VALUE" | \
gcloud secrets versions add DATABASE_URL_DEV \
  --project=storycare-dev-479511 \
  --data-file=-
```

### Update Production Secret
```bash
echo -n "NEW_VALUE" | \
gcloud secrets versions add DATABASE_URL \
  --project=storycare-prod-XXXXXX \
  --data-file=-
```

---

**Last Updated**: 2025-12-11
