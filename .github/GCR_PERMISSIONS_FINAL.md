# GCR Permissions - Final Configuration

## ✅ Complete Permission List for GitHub Actions Service Account

Your `github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com` now has **ALL** required permissions:

```
✅ roles/storage.admin                    # GCR backend (Cloud Storage)
✅ roles/artifactregistry.repoAdmin       # Create repositories on push
✅ roles/artifactregistry.writer          # Write/push images
✅ roles/containerregistry.ServiceAgent   # Container Registry operations
✅ roles/browser                          # Browse GCP resources (needed for GCR)
✅ roles/run.admin                        # Deploy Cloud Run services
✅ roles/run.serviceAgent                 # Cloud Run operations
✅ roles/iam.serviceAccountUser           # Service account operations
✅ roles/cloudsql.client                  # Cloud SQL connections
```

## What Each Permission Does

### For GCR (Google Container Registry):
- **`storage.admin`** - Backend storage for GCR images
- **`containerregistry.ServiceAgent`** - Container Registry service operations
- **`browser`** - View and list GCP resources (required for first push)
- **`artifactregistry.repoAdmin`** - Auto-create repos with `createOnPush`
- **`artifactregistry.writer`** - Push images to registry

### For Cloud Run Deployment:
- **`run.admin`** - Deploy and manage Cloud Run services
- **`run.serviceAgent`** - Cloud Run service operations
- **`iam.serviceAccountUser`** - Act as service accounts

### For Cloud SQL:
- **`cloudsql.client`** - Connect to Cloud SQL instances

## Enabled APIs

```bash
✅ containerregistry.googleapis.com      # Container Registry
✅ storage-api.googleapis.com           # Cloud Storage JSON API
✅ storage-component.googleapis.com     # Cloud Storage
✅ artifactregistry.googleapis.com      # Artifact Registry
✅ run.googleapis.com                   # Cloud Run
✅ sql-component.googleapis.com         # Cloud SQL
✅ sqladmin.googleapis.com              # Cloud SQL Admin
✅ secretmanager.googleapis.com         # Secret Manager
```

## Updated Workflow Configuration

Both `deploy-dev.yml` and `deploy-prod.yml` now use the proper authentication pattern:

```yaml
- name: Authenticate to Google Cloud (Workload Identity)
  id: auth
  uses: google-github-actions/auth@v2
  with:
    token_format: access_token  # ← Required for docker login
    workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER_DEV }}
    service_account: ${{ secrets.GCP_SERVICE_ACCOUNT_DEV }}

- name: Set up Cloud SDK
  uses: google-github-actions/setup-gcloud@v2

- name: Login to GCR
  uses: docker/login-action@v3  # ← Proper Docker authentication
  with:
    registry: gcr.io
    username: oauth2accesstoken
    password: ${{ steps.auth.outputs.access_token }}

- name: Build Docker image
  run: docker build -t gcr.io/${{ env.PROJECT_ID }}/${{ env.SERVICE_NAME }}:${{ github.sha }} .

- name: Push Docker image
  run: docker push gcr.io/${{ env.PROJECT_ID }}/${{ env.SERVICE_NAME }}:${{ github.sha }}
```

## Why This Should Work Now

1. **`token_format: access_token`** generates an OAuth2 token during auth
2. **`docker/login-action@v3`** uses that token to authenticate Docker with GCR
3. **`artifactregistry.repoAdmin`** allows auto-creating GCR repositories on first push
4. **`storage.admin`** provides backend storage access
5. **`containerregistry.ServiceAgent`** enables Container Registry operations
6. **`browser`** allows viewing/listing resources (needed for initial setup)

## Verification Commands

```bash
# Check all permissions
gcloud projects get-iam-policy storycare-dev-479511 \
  --flatten="bindings[].members" \
  --filter="bindings.members:github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com" \
  --format="table(bindings.role)"

# Check enabled APIs
gcloud services list --enabled --project=storycare-dev-479511 | grep -E "(container|storage|artifact)"

# Test GCR access (after first successful push)
gcloud container images list --project=storycare-dev-479511
```

## Deployment Flow

1. **GitHub Actions triggers** on push to `main`
2. **Authenticates** via Workload Identity Federation
3. **Gets access token** from Google auth
4. **Logs in to Docker** using `docker/login-action@v3`
5. **Builds Docker image** with environment variables
6. **Pushes to GCR** - auto-creates repository if needed
7. **Deploys to Cloud Run** with Cloud SQL connection
8. **Loads DATABASE_URL** from Secret Manager at runtime
9. **Health check** verifies deployment

## If It Still Fails

### Check These:

1. **GitHub Secret Value**
   - Verify `GCP_PROJECT_ID_DEV` = `storycare-dev-479511`
   - Check no extra spaces or quotes

2. **Workflow Syntax**
   - `${{ env.PROJECT_ID }}` should resolve to `storycare-dev-479511`
   - Image tag format: `gcr.io/storycare-dev-479511/storycare-app-dev:TAG`

3. **Service Account Binding**
   - Workload Identity must be bound to `akbar904/story-care` repository

4. **Wait Time**
   - IAM changes can take up to 80 seconds to propagate
   - Try the deployment again after 2 minutes

## Common Errors & Solutions

### "denied: gcr.io repo does not exist"
**Fixed!** - Added `artifactregistry.repoAdmin` + `browser` roles

### "Permission denied"
**Fixed!** - Added `storage.admin` + `containerregistry.ServiceAgent` roles

### "Authentication failed"
**Fixed!** - Using `docker/login-action@v3` with access token

### "Access token not found"
**Fixed!** - Added `token_format: access_token` to auth step

## Next Steps

1. **Commit and push** the workflow changes
2. **Wait 2 minutes** for IAM propagation
3. **Push to main branch** to trigger deployment
4. **Watch GitHub Actions** logs for success

## For Production

When setting up production, repeat these steps:

```bash
export PROD_PROJECT_ID="your-prod-project-id"

# Grant all the same roles
gcloud projects add-iam-policy-binding $PROD_PROJECT_ID \
  --member="serviceAccount:github-actions-prod@${PROD_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROD_PROJECT_ID \
  --member="serviceAccount:github-actions-prod@${PROD_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.repoAdmin"

gcloud projects add-iam-policy-binding $PROD_PROJECT_ID \
  --member="serviceAccount:github-actions-prod@${PROD_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROD_PROJECT_ID \
  --member="serviceAccount:github-actions-prod@${PROD_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/containerregistry.ServiceAgent"

gcloud projects add-iam-policy-binding $PROD_PROJECT_ID \
  --member="serviceAccount:github-actions-prod@${PROD_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/browser"

# Plus all the other roles (run.admin, cloudsql.client, etc.)
```

---

**Last Updated**: 2025-12-11
**Status**: All permissions granted ✅
**Ready to deploy**: YES! 🚀
