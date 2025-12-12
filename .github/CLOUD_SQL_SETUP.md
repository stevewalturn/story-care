# Cloud SQL Setup Guide for Development
## Adding DATABASE_URL_DEV to GCP Secret Manager

This guide shows you how to add your Cloud SQL connection string to GCP Secret Manager so the dev deployment workflow can access it securely.

---

## Your Cloud SQL Configuration

Based on your setup:
- **Project**: `storycare-dev-479511`
- **Cloud SQL Instance**: `storycare-478114:us-central1:storycare-dev`
- **Database**: `storycare_dev`
- **Username**: `postgres`
- **Password**: `I|0PRO]3ya4NC_BY`

---

## Step 1: Understand the Connection String Format

### ❌ Local Development (with Cloud SQL Proxy):
```bash
postgresql://postgres:I|0PRO]3ya4NC_BY@127.0.0.1:5432/storycare_dev?sslmode=disable
```

### ✅ Cloud Run (Unix Socket - Internal Network):
```bash
postgresql://postgres:I|0PRO]3ya4NC_BY@/storycare_dev?host=/cloudsql/storycare-478114:us-central1:storycare-dev
```

**Key Differences:**
- **Local**: Uses TCP connection (`@127.0.0.1:5432`)
- **Cloud Run**: Uses Unix socket (`@/` with `host=/cloudsql/...` parameter)
- Cloud Run automatically mounts the socket when using `--add-cloudsql-instances` flag

---

## Step 2: Create the Secret in GCP Secret Manager

### Option A: Using gcloud CLI (Recommended)

```bash
# Create the secret with your connection string
echo -n "postgresql://postgres:I|0PRO]3ya4NC_BY@/storycare_dev?host=/cloudsql/storycare-478114:us-central1:storycare-dev" | \
gcloud secrets create DATABASE_URL_DEV \
  --project=storycare-dev-479511 \
  --data-file=- \
  --replication-policy="automatic"
```

**Expected output:**
```
Created version [1] of the secret [DATABASE_URL_DEV].
```

### Option B: Using GCP Console

1. Go to: https://console.cloud.google.com/security/secret-manager?project=storycare-dev-479511
2. Click **"CREATE SECRET"**
3. Fill in:
   - **Name**: `DATABASE_URL_DEV`
   - **Secret value**:
     ```
     postgresql://postgres:I|0PRO]3ya4NC_BY@/storycare_dev?host=/cloudsql/storycare-478114:us-central1:storycare-dev
     ```
4. Click **"CREATE SECRET"**

---

## Step 3: Grant Access to the Service Account

Your Cloud Run service needs permission to read this secret.

```bash
# Grant Secret Manager Secret Accessor role to the service account
gcloud secrets add-iam-policy-binding DATABASE_URL_DEV \
  --project=storycare-dev-479511 \
  --member="serviceAccount:github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

**Expected output:**
```
Updated IAM policy for secret [DATABASE_URL_DEV].
```

**Also grant to the Cloud Run service account:**
```bash
# Get the Cloud Run default service account
PROJECT_NUMBER=$(gcloud projects describe storycare-dev-479511 --format="value(projectNumber)")

# Grant access to Cloud Run service account
gcloud secrets add-iam-policy-binding DATABASE_URL_DEV \
  --project=storycare-dev-479511 \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## Step 4: Grant Cloud SQL Client Role

Your service account needs permission to connect to Cloud SQL:

```bash
# Grant Cloud SQL Client role to GitHub Actions service account
gcloud projects add-iam-policy-binding storycare-dev-479511 \
  --member="serviceAccount:github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Grant to Cloud Run service account
PROJECT_NUMBER=$(gcloud projects describe storycare-dev-479511 --format="value(projectNumber)")

gcloud projects add-iam-policy-binding storycare-dev-479511 \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

---

## Step 5: Verify the Secret

```bash
# List all secrets
gcloud secrets list --project=storycare-dev-479511

# View the secret value (to verify it's correct)
gcloud secrets versions access latest \
  --secret="DATABASE_URL_DEV" \
  --project=storycare-dev-479511
```

**Expected output:**
```
postgresql://postgres:I|0PRO]3ya4NC_BY@/storycare_dev?host=/cloudsql/storycare-478114:us-central1:storycare-dev
```

---

## Step 6: Verify Permissions

```bash
# Check IAM policy on the secret
gcloud secrets get-iam-policy DATABASE_URL_DEV \
  --project=storycare-dev-479511
```

**You should see:**
```yaml
bindings:
- members:
  - serviceAccount:github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com
  - serviceAccount:780029180736-compute@developer.gserviceaccount.com
  role: roles/secretmanager.secretAccessor
```

---

## How It Works in the Workflow

In your updated `deploy-dev.yml`:

```yaml
- name: Deploy to Cloud Run (Dev)
  uses: google-github-actions/deploy-cloudrun@v2
  with:
    service: storycare-app-dev
    region: us-central1
    image: gcr.io/${{ env.PROJECT_ID }}/storycare-app-dev:${{ github.sha }}
    flags: |
      --add-cloudsql-instances=storycare-478114:us-central1:storycare-dev  # Mounts unix socket
      --update-secrets=DATABASE_URL=DATABASE_URL_DEV:latest                # Injects secret as env var
```

**What happens:**
1. `--add-cloudsql-instances` mounts the Cloud SQL unix socket at `/cloudsql/storycare-478114:us-central1:storycare-dev`
2. `--update-secrets=DATABASE_URL=DATABASE_URL_DEV:latest` loads the secret and sets it as the `DATABASE_URL` environment variable
3. Your Next.js app reads `process.env.DATABASE_URL` and connects via the unix socket

---

## Troubleshooting

### Error: "Secret not found"
```bash
# Make sure the secret exists
gcloud secrets list --project=storycare-dev-479511 | grep DATABASE_URL_DEV
```

### Error: "Permission denied on secret"
```bash
# Re-grant permissions
gcloud secrets add-iam-policy-binding DATABASE_URL_DEV \
  --project=storycare-dev-479511 \
  --member="serviceAccount:github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Error: "Could not connect to Cloud SQL"
- Verify the Cloud SQL instance name matches: `storycare-478114:us-central1:storycare-dev`
- Ensure `--add-cloudsql-instances` flag is present in deployment
- Check that both service accounts have `roles/cloudsql.client` role

### Database connection fails in Cloud Run
```bash
# Check Cloud Run logs
gcloud run services logs read storycare-app-dev \
  --region=us-central1 \
  --project=storycare-dev-479511 \
  --limit=50

# Look for connection errors
```

### Test the secret manually
```bash
# Deploy a test Cloud Run service with the secret
gcloud run deploy test-db-connection \
  --image=gcr.io/cloudrun/hello \
  --region=us-central1 \
  --project=storycare-dev-479511 \
  --add-cloudsql-instances=storycare-478114:us-central1:storycare-dev \
  --update-secrets=DATABASE_URL=DATABASE_URL_DEV:latest \
  --no-allow-unauthenticated

# Check if it deployed successfully
gcloud run services describe test-db-connection \
  --region=us-central1 \
  --project=storycare-dev-479511
```

---

## Update Secret (if password changes)

```bash
# Add a new version of the secret
echo -n "postgresql://postgres:NEW_PASSWORD@/storycare_dev?host=/cloudsql/storycare-478114:us-central1:storycare-dev" | \
gcloud secrets versions add DATABASE_URL_DEV \
  --project=storycare-dev-479511 \
  --data-file=-

# The deployment will automatically use the latest version
```

---

## Summary of Required Permissions

### GitHub Actions Service Account (`github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com`):
- ✅ `roles/run.admin` - Deploy Cloud Run services
- ✅ `roles/storage.admin` - Push to GCR
- ✅ `roles/iam.serviceAccountUser` - Act as other service accounts
- ✅ `roles/cloudsql.client` - Configure Cloud SQL connections
- ✅ `roles/secretmanager.secretAccessor` (on DATABASE_URL_DEV secret)

### Cloud Run Service Account (`780029180736-compute@developer.gserviceaccount.com`):
- ✅ `roles/cloudsql.client` - Connect to Cloud SQL
- ✅ `roles/secretmanager.secretAccessor` (on DATABASE_URL_DEV secret)

---

## Next Steps

1. ✅ Create `DATABASE_URL_DEV` secret in GCP Secret Manager
2. ✅ Grant permissions to both service accounts
3. ✅ Push to `main` branch to trigger deployment
4. ✅ Verify deployment in GitHub Actions
5. ✅ Check Cloud Run logs to ensure database connection works

---

**Last Updated**: 2025-12-11
**Project**: StoryCare Dev (storycare-dev-479511)
**Cloud SQL Instance**: `storycare-478114:us-central1:storycare-dev`
