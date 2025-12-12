# GCR (Google Container Registry) Troubleshooting Guide
## Fixing "Permission Denied" and "Repository Does Not Exist" Errors

This guide helps you resolve common Google Container Registry (gcr.io) permission issues in GitHub Actions.

---

## Common Errors

### Error 1: Permission Denied
```
denied: Permission "artifactregistry.repositories.uploadArtifacts" denied
```

### Error 2: Repository Does Not Exist
```
denied: gcr.io repo does not exist. Creating on push requires the artifactregistry.repositories.createOnPush permission
```

### Error 3: Authentication Failed
```
unauthorized: authentication failed
```

---

## ✅ Your Current Setup (Development)

Your dev environment is **correctly configured** with these permissions:

```bash
Service Account: github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com

Permissions:
✅ roles/storage.admin          # Required for GCR (uses Cloud Storage)
✅ roles/run.admin              # Required for Cloud Run deployment
✅ roles/iam.serviceAccountUser # Required for acting as service accounts
✅ roles/cloudsql.client        # Required for Cloud SQL connection
✅ roles/run.serviceAgent       # Required for Cloud Run operations
```

---

## Understanding GCR vs Artifact Registry

### GCR (gcr.io) - What you're using ✅
- **Backend**: Google Cloud Storage
- **Required Permission**: `roles/storage.admin`
- **Image Format**: `gcr.io/PROJECT_ID/IMAGE_NAME:TAG`
- **Simpler**: Less configuration needed
- **Status**: Still fully supported

### Artifact Registry (pkg.dev) - Alternative
- **Backend**: Dedicated Artifact Registry service
- **Required Permissions**: `roles/artifactregistry.writer` + `roles/artifactregistry.createOnPush`
- **Image Format**: `REGION-docker.pkg.dev/PROJECT_ID/REPO_NAME/IMAGE_NAME:TAG`
- **More features**: Multi-regional, better security
- **Migration**: Optional, not required

**Recommendation**: Stick with `gcr.io` - it's simpler and works perfectly for your use case.

---

## How GCR Authentication Works in GitHub Actions

### Your Workflow Pattern (Correct ✅)

```yaml
- name: Authenticate to Google Cloud
  uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER_DEV }}
    service_account: ${{ secrets.GCP_SERVICE_ACCOUNT_DEV }}

- name: Set up Cloud SDK
  uses: google-github-actions/setup-gcloud@v2

- name: Configure Docker for GCR
  run: gcloud auth configure-docker gcr.io

- name: Build and Push
  run: |
    docker build -t gcr.io/PROJECT_ID/SERVICE_NAME:TAG .
    docker push gcr.io/PROJECT_ID/SERVICE_NAME:TAG
```

**Key Points:**
1. **Workload Identity Federation** handles authentication (no keys!)
2. **`gcloud auth configure-docker`** configures Docker to use gcloud credentials
3. **Storage Admin role** allows pushing images to GCR

---

## Troubleshooting Steps

### Step 1: Verify Service Account Has Storage Admin

```bash
# Check if Storage Admin role is granted
gcloud projects get-iam-policy storycare-dev-479511 \
  --flatten="bindings[].members" \
  --filter="bindings.members:github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com AND bindings.role:roles/storage.admin"
```

**Expected output:**
```yaml
bindings:
  members: serviceAccount:github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com
  role: roles/storage.admin
```

**If missing, grant it:**
```bash
gcloud projects add-iam-policy-binding storycare-dev-479511 \
  --member="serviceAccount:github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com" \
  --role="roles/storage.admin"
```

### Step 2: Verify Workload Identity Binding

```bash
# Check WIF binding
gcloud iam service-accounts get-iam-policy \
  github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com \
  --project=storycare-dev-479511
```

**Expected output:**
```yaml
bindings:
- members:
  - principalSet://iam.googleapis.com/projects/780029180736/locations/global/workloadIdentityPools/github-dev/attribute.repository/akbar904/story-care
  role: roles/iam.workloadIdentityUser
```

### Step 3: Enable Container Registry API

```bash
# Enable the API (should already be enabled)
gcloud services enable containerregistry.googleapis.com \
  --project=storycare-dev-479511
```

### Step 4: Test Local Push (Optional)

```bash
# Authenticate locally
gcloud auth login
gcloud config set project storycare-dev-479511

# Configure Docker
gcloud auth configure-docker gcr.io

# Build and push test image
docker build -t gcr.io/storycare-dev-479511/test:latest .
docker push gcr.io/storycare-dev-479511/test:latest
```

---

## Common Mistakes and Solutions

### Mistake 1: Using Artifact Registry URL with GCR Permissions

❌ **Wrong:**
```yaml
# Trying to push to Artifact Registry without proper setup
docker push us-central1-docker.pkg.dev/PROJECT_ID/REPO/IMAGE
```

✅ **Correct (for your setup):**
```yaml
# Use gcr.io with Storage Admin permission
docker push gcr.io/PROJECT_ID/IMAGE_NAME:TAG
```

### Mistake 2: Missing Docker Configuration

❌ **Wrong:**
```yaml
# Skipping docker auth configuration
- name: Push Docker image
  run: docker push gcr.io/PROJECT_ID/IMAGE
```

✅ **Correct:**
```yaml
- name: Configure Docker for GCR
  run: gcloud auth configure-docker gcr.io

- name: Push Docker image
  run: docker push gcr.io/PROJECT_ID/IMAGE
```

### Mistake 3: Wrong Project ID in Image Tag

❌ **Wrong:**
```bash
# Using wrong project ID
docker push gcr.io/wrong-project-id/image:latest
```

✅ **Correct:**
```bash
# Use correct project ID from secrets
docker push gcr.io/${{ secrets.GCP_PROJECT_ID_DEV }}/image:latest
```

### Mistake 4: Pushing Before Configuring Docker

❌ **Wrong Order:**
```yaml
- name: Push image
  run: docker push gcr.io/PROJECT/IMAGE

- name: Configure Docker  # Too late!
  run: gcloud auth configure-docker gcr.io
```

✅ **Correct Order:**
```yaml
- name: Configure Docker
  run: gcloud auth configure-docker gcr.io

- name: Push image
  run: docker push gcr.io/PROJECT/IMAGE
```

---

## Verifying Your Setup

### Check All Service Account Permissions

```bash
gcloud projects get-iam-policy storycare-dev-479511 \
  --flatten="bindings[].members" \
  --filter="bindings.members:github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com" \
  --format="table(bindings.role)"
```

**You should see:**
```
ROLE
roles/cloudsql.client
roles/iam.serviceAccountUser
roles/run.admin
roles/run.serviceAgent
roles/storage.admin          # ← This is required for GCR!
```

### Check Enabled APIs

```bash
gcloud services list --enabled --project=storycare-dev-479511 | grep -E "(container|storage|artifact)"
```

**You should see:**
```
containerregistry.googleapis.com    Container Registry API
storage-api.googleapis.com          Google Cloud Storage JSON API
storage-component.googleapis.com    Cloud Storage
```

---

## Advanced: Migrating to Artifact Registry (Optional)

If you want to migrate from GCR to Artifact Registry in the future:

### 1. Create Artifact Registry Repository

```bash
gcloud artifacts repositories create docker-images \
  --repository-format=docker \
  --location=us-central1 \
  --project=storycare-dev-479511 \
  --description="Docker images repository"
```

### 2. Grant Permissions

```bash
gcloud projects add-iam-policy-binding storycare-dev-479511 \
  --member="serviceAccount:github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"
```

### 3. Update Workflow

```yaml
- name: Configure Docker for Artifact Registry
  run: gcloud auth configure-docker us-central1-docker.pkg.dev

- name: Push to Artifact Registry
  run: |
    docker tag IMAGE us-central1-docker.pkg.dev/storycare-dev-479511/docker-images/IMAGE:TAG
    docker push us-central1-docker.pkg.dev/storycare-dev-479511/docker-images/IMAGE:TAG
```

**Note**: This is optional and not required for your current setup to work.

---

## Quick Reference: GCR Commands

```bash
# List all images in GCR
gcloud container images list --project=storycare-dev-479511

# List tags for a specific image
gcloud container images list-tags gcr.io/storycare-dev-479511/storycare-app-dev

# Delete an image
gcloud container images delete gcr.io/storycare-dev-479511/IMAGE:TAG --quiet

# Pull an image locally
docker pull gcr.io/storycare-dev-479511/storycare-app-dev:latest
```

---

## When to Contact Support

If you've verified all of the above and still have issues:

1. Check GitHub Actions logs for the exact error message
2. Verify the service account email in the workflow matches exactly
3. Check if the GCP project ID is correct
4. Ensure you're not hitting API quota limits
5. Try re-authenticating: `gcloud auth login` and `gcloud auth configure-docker gcr.io`

---

## Summary Checklist

Your dev environment should have:

- [x] Service account created: `github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com`
- [x] Storage Admin role granted
- [x] Workload Identity binding configured
- [x] Container Registry API enabled
- [x] GitHub secrets configured (GCP_PROJECT_ID_DEV, etc.)
- [x] Workflow includes `gcloud auth configure-docker gcr.io`

**All of these are ✅ configured correctly in your dev environment!**

---

**Last Updated**: 2025-12-11
**Status**: Dev environment fully configured ✅
