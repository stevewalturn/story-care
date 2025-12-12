# Production Deployment Setup Guide
## Complete Setup for StoryCare Production Environment

This guide walks you through setting up the production deployment workflow with Workload Identity Federation, Cloud SQL, and GitHub Actions.

---

## Prerequisites

Before starting, you need:
- ✅ A separate GCP project for production (different from `storycare-dev-479511`)
- ✅ Admin access to both GitHub repository and GCP project
- ✅ `gcloud` CLI installed and authenticated
- ✅ Production Cloud SQL instance created

---

## Step 1: Set Up Production GCP Project

### 1.1 Create Production Project (if not exists)

```bash
# Create a new project for production
gcloud projects create storycare-prod-XXXXXX --name="StoryCare Production"

# Set as active project
gcloud config set project storycare-prod-XXXXXX

# Link billing account (replace BILLING_ACCOUNT_ID)
gcloud billing projects link storycare-prod-XXXXXX \
  --billing-account=BILLING_ACCOUNT_ID
```

### 1.2 Enable Required APIs

```bash
# Replace with your production project ID
export PROD_PROJECT_ID="storycare-prod-XXXXXX"

# Enable all required APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  iamcredentials.googleapis.com \
  cloudresourcemanager.googleapis.com \
  sts.googleapis.com \
  sql-component.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  --project=$PROD_PROJECT_ID
```

---

## Step 2: Create Production Cloud SQL Instance

### 2.1 Create Cloud SQL Instance

```bash
# Create PostgreSQL instance for production
gcloud sql instances create storycare-prod \
  --project=$PROD_PROJECT_ID \
  --database-version=POSTGRES_15 \
  --tier=db-custom-2-7680 \
  --region=us-central1 \
  --storage-type=SSD \
  --storage-size=20GB \
  --storage-auto-increase \
  --backup \
  --backup-start-time=03:00 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=04 \
  --availability-type=REGIONAL
```

### 2.2 Set Root Password

```bash
# Generate a strong password (or use your own)
export PROD_DB_PASSWORD="$(openssl rand -base64 32)"
echo "Save this password: $PROD_DB_PASSWORD"

# Set the password
gcloud sql users set-password postgres \
  --instance=storycare-prod \
  --project=$PROD_PROJECT_ID \
  --password="$PROD_DB_PASSWORD"
```

### 2.3 Create Database

```bash
# Create the production database
gcloud sql databases create storycare_prod \
  --instance=storycare-prod \
  --project=$PROD_PROJECT_ID
```

### 2.4 Get Connection Name

```bash
# Get the full connection name (format: PROJECT:REGION:INSTANCE)
gcloud sql instances describe storycare-prod \
  --project=$PROD_PROJECT_ID \
  --format="value(connectionName)"
```

**Save this output!** Example: `storycare-prod-123456:us-central1:storycare-prod`

---

## Step 3: Set Up Workload Identity Federation (Production)

### 3.1 Get Project Number

```bash
gcloud projects describe $PROD_PROJECT_ID --format="value(projectNumber)"
```

**Save this number!** Example: `987654321098`

### 3.2 Create Workload Identity Pool

```bash
gcloud iam workload-identity-pools create "github-prod" \
  --project=$PROD_PROJECT_ID \
  --location="global" \
  --display-name="GitHub Actions Pool (Production)"
```

### 3.3 Create Workload Identity Provider

**⚠️ Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username or organization!**

```bash
gcloud iam workload-identity-pools providers create-oidc "github-prod-provider" \
  --project=$PROD_PROJECT_ID \
  --location="global" \
  --workload-identity-pool="github-prod" \
  --display-name="GitHub Actions Provider (Production)" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository_owner == 'YOUR_GITHUB_USERNAME'" \
  --issuer-uri="https://token.actions.githubusercontent.com"
```

### 3.4 Get Workload Identity Provider Resource Name

```bash
gcloud iam workload-identity-pools providers describe "github-prod-provider" \
  --project=$PROD_PROJECT_ID \
  --location="global" \
  --workload-identity-pool="github-prod" \
  --format="value(name)"
```

**📝 Save this as `GCP_WORKLOAD_IDENTITY_PROVIDER_PROD`**

Example output:
```
projects/987654321098/locations/global/workloadIdentityPools/github-prod/providers/github-prod-provider
```

---

## Step 4: Create Service Account

### 4.1 Create Service Account

```bash
gcloud iam service-accounts create github-actions-prod \
  --project=$PROD_PROJECT_ID \
  --display-name="GitHub Actions Service Account (Production)" \
  --description="Service account for GitHub Actions to deploy to Cloud Run (Production)"
```

**📝 Service account email:** `github-actions-prod@YOUR_PROD_PROJECT_ID.iam.gserviceaccount.com`

### 4.2 Grant Required Permissions

```bash
# Cloud Run Admin
gcloud projects add-iam-policy-binding $PROD_PROJECT_ID \
  --member="serviceAccount:github-actions-prod@${PROD_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.admin"

# Storage Admin (for GCR)
gcloud projects add-iam-policy-binding $PROD_PROJECT_ID \
  --member="serviceAccount:github-actions-prod@${PROD_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Service Account User
gcloud projects add-iam-policy-binding $PROD_PROJECT_ID \
  --member="serviceAccount:github-actions-prod@${PROD_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Cloud SQL Client
gcloud projects add-iam-policy-binding $PROD_PROJECT_ID \
  --member="serviceAccount:github-actions-prod@${PROD_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

### 4.3 Bind Workload Identity

**⚠️ Replace `PROJECT_NUMBER` and `YOUR_GITHUB_USERNAME`!**

```bash
export PROJECT_NUMBER="987654321098"  # From Step 3.1
export GITHUB_USERNAME="YOUR_GITHUB_USERNAME"

gcloud iam service-accounts add-iam-policy-binding \
  "github-actions-prod@${PROD_PROJECT_ID}.iam.gserviceaccount.com" \
  --project=$PROD_PROJECT_ID \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-prod/attribute.repository/${GITHUB_USERNAME}/story-care"
```

---

## Step 5: Create DATABASE_URL Secret in Secret Manager

### 5.1 Build the Connection String

**Format for Cloud Run (Unix Socket):**
```
postgresql://postgres:YOUR_PASSWORD@/storycare_prod?host=/cloudsql/YOUR_CONNECTION_NAME
```

**Example:**
```bash
export CONNECTION_NAME="storycare-prod-123456:us-central1:storycare-prod"
export DB_PASSWORD="your-secure-password-from-step-2.2"

# Full connection string
export DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@/storycare_prod?host=/cloudsql/${CONNECTION_NAME}"

echo "Your DATABASE_URL:"
echo $DATABASE_URL
```

### 5.2 Create the Secret

```bash
# Create DATABASE_URL secret
echo -n "$DATABASE_URL" | \
gcloud secrets create DATABASE_URL \
  --project=$PROD_PROJECT_ID \
  --data-file=- \
  --replication-policy="automatic"
```

### 5.3 Grant Access to Service Accounts

```bash
# Grant to GitHub Actions service account
gcloud secrets add-iam-policy-binding DATABASE_URL \
  --project=$PROD_PROJECT_ID \
  --member="serviceAccount:github-actions-prod@${PROD_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Grant to Cloud Run default service account
export PROJECT_NUMBER=$(gcloud projects describe $PROD_PROJECT_ID --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding DATABASE_URL \
  --project=$PROD_PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Also grant Cloud SQL Client to Cloud Run service account
gcloud projects add-iam-policy-binding $PROD_PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

---

## Step 6: Update Production Workflow

The workflow needs to be updated to use `deploy-cloudrun` action and add Cloud SQL connection.

**Key changes needed in `deploy-prod.yml`:**

```yaml
- name: Deploy to Cloud Run (Production)
  id: deploy
  uses: google-github-actions/deploy-cloudrun@v2
  with:
    service: ${{ env.SERVICE_NAME }}
    region: ${{ env.GCP_REGION }}
    image: gcr.io/${{ secrets.GCP_PROJECT_ID_PROD }}/${{ env.SERVICE_NAME }}:${{ github.sha }}
    flags: |
      --platform=managed
      --allow-unauthenticated
      --memory=4Gi
      --cpu=2
      --timeout=300
      --max-instances=100
      --min-instances=1
      --port=8080
      --add-cloudsql-instances=YOUR_CONNECTION_NAME  # ADD THIS
      --set-env-vars=NODE_ENV=production
      --update-secrets=DATABASE_URL=DATABASE_URL:latest  # ADD THIS
```

---

## Step 7: Add GitHub Secrets

Go to: `https://github.com/YOUR_USERNAME/story-care/settings/secrets/actions`

Add these **4 production secrets**:

### 7.1 GCP_PROJECT_ID_PROD
```
storycare-prod-XXXXXX
```

### 7.2 GCP_WORKLOAD_IDENTITY_PROVIDER_PROD
From Step 3.4, example:
```
projects/987654321098/locations/global/workloadIdentityPools/github-prod/providers/github-prod-provider
```

### 7.3 GCP_SERVICE_ACCOUNT_PROD
```
github-actions-prod@storycare-prod-XXXXXX.iam.gserviceaccount.com
```

### 7.4 ENV_FILE_PROD
Your production environment variables (all `NEXT_PUBLIC_*` and other build-time vars):

```env
# Firebase Authentication (Production)
NEXT_PUBLIC_FIREBASE_API_KEY=your_prod_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-prod-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-prod-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-prod-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_prod_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_prod_app_id

# Firebase Admin (Production)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Google Cloud Storage (Production)
GCS_PROJECT_ID=storycare-prod-XXXXXX
GCS_BUCKET_NAME=storycare-prod-media
GCS_CLIENT_EMAIL=your-service-account@storycare-prod-XXXXXX.iam.gserviceaccount.com
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# AI Services (Production keys)
DEEPGRAM_API_KEY=...
OPENAI_API_KEY=...

# Security (Production)
ARCJET_KEY=ajkey_prod_...

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
NEXT_PUBLIC_APP_NAME=StoryCare

# NOTE: DATABASE_URL is NOT in this file - it comes from GCP Secret Manager at runtime
```

---

## Step 8: Verify Everything

### 8.1 Check Workload Identity Setup

```bash
# List workload identity pools
gcloud iam workload-identity-pools list \
  --location=global \
  --project=$PROD_PROJECT_ID

# List providers
gcloud iam workload-identity-pools providers list \
  --workload-identity-pool=github-prod \
  --location=global \
  --project=$PROD_PROJECT_ID
```

### 8.2 Check Service Account IAM Policy

```bash
gcloud iam service-accounts get-iam-policy \
  github-actions-prod@${PROD_PROJECT_ID}.iam.gserviceaccount.com \
  --project=$PROD_PROJECT_ID
```

### 8.3 Check Secret

```bash
# List secrets
gcloud secrets list --project=$PROD_PROJECT_ID

# View DATABASE_URL secret value
gcloud secrets versions access latest \
  --secret="DATABASE_URL" \
  --project=$PROD_PROJECT_ID
```

### 8.4 Check Cloud SQL Instance

```bash
# Get instance details
gcloud sql instances describe storycare-prod \
  --project=$PROD_PROJECT_ID

# List databases
gcloud sql databases list \
  --instance=storycare-prod \
  --project=$PROD_PROJECT_ID
```

---

## Step 9: Test Deployment

### 9.1 Trigger Manual Deployment

1. Go to: `https://github.com/YOUR_USERNAME/story-care/actions`
2. Select **"Deploy to Production"** workflow
3. Click **"Run workflow"**
4. Type `deploy` in the confirmation field
5. Click **"Run workflow"**

### 9.2 Monitor Deployment

Watch the GitHub Actions logs for:
- ✅ Successful authentication
- ✅ Docker image build
- ✅ Image push to GCR
- ✅ Cloud Run deployment
- ✅ Health check passing

### 9.3 Check Cloud Run Logs

```bash
# View Cloud Run service logs
gcloud run services logs read storycare-app \
  --region=us-central1 \
  --project=$PROD_PROJECT_ID \
  --limit=100

# Check for database connection
gcloud run services logs read storycare-app \
  --region=us-central1 \
  --project=$PROD_PROJECT_ID \
  --limit=100 | grep -i "database\|postgres\|connection"
```

---

## Troubleshooting

### Error: "Workload Identity Provider not found"
```bash
# Verify the provider exists
gcloud iam workload-identity-pools providers list \
  --workload-identity-pool=github-prod \
  --location=global \
  --project=$PROD_PROJECT_ID
```

### Error: "Permission denied on secret"
```bash
# Re-grant permissions
gcloud secrets add-iam-policy-binding DATABASE_URL \
  --project=$PROD_PROJECT_ID \
  --member="serviceAccount:github-actions-prod@${PROD_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Error: "Could not connect to Cloud SQL"
```bash
# Verify Cloud SQL instance is running
gcloud sql instances list --project=$PROD_PROJECT_ID

# Check if --add-cloudsql-instances flag is in deployment
# Ensure connection name format is correct: PROJECT:REGION:INSTANCE
```

### Database connection times out
```bash
# Check if Cloud Run service account has cloudsql.client role
gcloud projects get-iam-policy $PROD_PROJECT_ID \
  --flatten="bindings[].members" \
  --format="table(bindings.role)" \
  --filter="bindings.members:serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
```

---

## Security Best Practices

### 1. Separate Dev and Prod Completely
- ✅ Different GCP projects
- ✅ Different Cloud SQL instances
- ✅ Different service accounts
- ✅ Different GitHub secrets

### 2. Use Strong Passwords
```bash
# Generate secure passwords
openssl rand -base64 32
```

### 3. Enable Backup and High Availability
- ✅ Automated backups configured
- ✅ Regional availability for production
- ✅ Point-in-time recovery enabled

### 4. Monitor Production
```bash
# Set up alerts for Cloud Run
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Cloud Run Error Rate" \
  --condition-display-name="High error rate" \
  --condition-threshold-value=0.1 \
  --condition-threshold-duration=300s
```

### 5. Rotate Secrets Regularly
```bash
# Update DATABASE_URL when rotating password
echo -n "postgresql://postgres:NEW_PASSWORD@/storycare_prod?host=/cloudsql/CONNECTION_NAME" | \
gcloud secrets versions add DATABASE_URL \
  --project=$PROD_PROJECT_ID \
  --data-file=-
```

---

## Quick Reference: All Secrets Needed

### GitHub Secrets (4 total):
1. `GCP_PROJECT_ID_PROD` - Production GCP project ID
2. `GCP_WORKLOAD_IDENTITY_PROVIDER_PROD` - WIF provider resource name
3. `GCP_SERVICE_ACCOUNT_PROD` - Service account email
4. `ENV_FILE_PROD` - All build-time environment variables

### GCP Secret Manager (1 secret):
1. `DATABASE_URL` - PostgreSQL connection string with unix socket format

---

## Summary Checklist

- [ ] Production GCP project created
- [ ] All required APIs enabled
- [ ] Cloud SQL instance created and configured
- [ ] Production database created
- [ ] Root password set and saved securely
- [ ] Workload Identity Pool created
- [ ] Workload Identity Provider created
- [ ] Service account created
- [ ] All IAM permissions granted
- [ ] Workload Identity binding configured
- [ ] DATABASE_URL secret created in Secret Manager
- [ ] Secret access granted to service accounts
- [ ] All 4 GitHub secrets added
- [ ] `deploy-prod.yml` updated with Cloud SQL flags
- [ ] Test deployment successful
- [ ] Health check passing
- [ ] Database connection working

---

**Last Updated**: 2025-12-11
**For**: StoryCare Production Deployment
**Contact**: Check with team lead if you encounter issues
