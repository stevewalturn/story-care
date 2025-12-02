# Complete Permissions for GitHub Actions → Cloud Run Deployment

## Required IAM Roles for Service Account: `github-actions@storycare-478114.iam.gserviceaccount.com`

### Core Deployment Roles:

1. **`roles/run.admin`** (Cloud Run Admin)
   - Deploy Cloud Run services
   - Update service configurations
   - Delete services

2. **`roles/iam.serviceAccountUser`** (Service Account User)
   - Required to deploy Cloud Run services that run as a service account
   - Allows the deployment to "act as" the Cloud Run runtime service account

3. **`roles/storage.admin`** (Storage Admin)
   - Push Docker images to Google Container Registry (GCR)
   - GCR stores images in Google Cloud Storage buckets

### Additional Roles You Might Need:

4. **`roles/artifactregistry.writer`** (Artifact Registry Writer)
   - If using Artifact Registry instead of GCR
   - Future-proof as GCR is being deprecated in favor of Artifact Registry

5. **`roles/cloudsql.client`** (Cloud SQL Client) - **IMPORTANT!**
   - Your Cloud Run service connects to Cloud SQL
   - The deployment service account needs this to configure Cloud SQL connections
   - Add flag: `--add-cloudsql-instances=storycare-478114:us-central1:storycare-dev`

6. **`roles/secretmanager.secretAccessor`** (Secret Manager Secret Accessor) - **IMPORTANT!**
   - Your workflow uses: `--update-secrets=DATABASE_URL=DATABASE_URL_DEV:latest`
   - The deployment service account needs permission to read secrets

### APIs to Enable:

```bash
gcloud services enable run.googleapis.com
gcloud services enable iamcredentials.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

## What's Currently in Your Workflow:

From `deploy-dev.yml`:
```yaml
--add-cloudsql-instances=storycare-478114:us-central1:storycare-dev  # Needs Cloud SQL Client role
--update-secrets=DATABASE_URL=DATABASE_URL_DEV:latest                 # Needs Secret Manager accessor
```

## Recommendation:

Add these 2 critical roles:
- `roles/cloudsql.client` (for Cloud SQL connection)
- `roles/secretmanager.secretAccessor` (for reading DATABASE_URL secret)
