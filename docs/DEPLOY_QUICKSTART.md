# Cloud Run Deployment - Quick Start Guide

Quick reference for common deployment tasks. For detailed instructions, see [DEPLOY.md](./DEPLOY.md).

## 🚀 First Time Setup (One-Time Only)

### 1. Prerequisites
```bash
# Install gcloud CLI (macOS)
brew install --cask google-cloud-sdk

# Login and set project
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 2. Enable APIs
```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  containerregistry.googleapis.com
```

### 3. Setup Environment Variables
```bash
# Run the automated setup script
chmod +x scripts/setup-gcp-secrets.sh
./scripts/setup-gcp-secrets.sh
```

### 4. Grant Permissions
```bash
# Get your project number
export PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

# Grant Cloud Build permissions
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor

gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
  --role=roles/run.admin

gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
  --role=roles/iam.serviceAccountUser

# Grant Cloud Run permissions
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member=serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

### 5. Connect GitHub (For Auto-Deploy)
1. Go to https://console.cloud.google.com/cloud-build/triggers
2. Click "Connect Repository" → Select GitHub
3. Authenticate and select your repository
4. Create trigger:
   - Name: `storycare-deploy-main`
   - Event: Push to branch `^main$`
   - Configuration: `cloudbuild.yaml`

---

## 📦 Deploy to Cloud Run

### Option A: Auto-Deploy (Recommended)
Just push to main branch - Cloud Build handles the rest!
```bash
git add .
git commit -m "feat: your changes"
git push origin main
```

### Option B: Manual Deploy
```bash
# Build and deploy in one command
gcloud run deploy storycare-app \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 4Gi \
  --cpu 2
```

---

## 🔍 Common Commands

### View Logs
```bash
# Stream live logs
gcloud run services logs tail storycare-app --region us-central1

# View recent logs
gcloud run services logs read storycare-app --region us-central1 --limit 50
```

### Get Service URL
```bash
gcloud run services describe storycare-app \
  --region us-central1 \
  --format 'value(status.url)'
```

### Check Health
```bash
curl https://YOUR_CLOUD_RUN_URL/api/health
```

### Update Environment Variable
```bash
# Update a secret
echo -n "new-value" | gcloud secrets versions add SECRET_NAME --data-file=-

# Cloud Run will automatically use the new value on next deployment
```

### View Build Status
```bash
# List recent builds
gcloud builds list --limit=5

# Stream build logs
gcloud builds log BUILD_ID --stream
```

---

## 🐛 Quick Troubleshooting

### Build Failed
```bash
# Check Cloud Build logs
gcloud builds list --limit=1
gcloud builds log $(gcloud builds list --limit=1 --format='value(id)') --stream
```

### Deployment Failed
```bash
# Check Cloud Run logs
gcloud run services logs read storycare-app --region us-central1 --filter "severity>=ERROR" --limit 20
```

### Database Connection Issues
```bash
# Verify DATABASE_URL secret
gcloud secrets versions access latest --secret="DATABASE_URL"

# Test database connection
psql "YOUR_DATABASE_URL"
```

### Out of Memory
```bash
# Increase memory
gcloud run services update storycare-app \
  --region us-central1 \
  --memory 8Gi
```

### Slow Startup
```bash
# Increase timeout
gcloud run services update storycare-app \
  --region us-central1 \
  --timeout 600
```

---

## 🔐 Security Checklist

- [ ] All secrets stored in Secret Manager (not in code)
- [ ] Firebase authorized domains updated with Cloud Run URL
- [ ] Database firewall configured (if using Cloud SQL)
- [ ] CORS configured in Next.js middleware (if needed)
- [ ] SSL/TLS enabled (automatic with Cloud Run)
- [ ] IAM permissions properly scoped
- [ ] No sensitive data in logs

---

## 💰 Cost Optimization

```bash
# Scale to zero when idle (default)
gcloud run services update storycare-app \
  --region us-central1 \
  --min-instances 0

# Limit max instances
gcloud run services update storycare-app \
  --region us-central1 \
  --max-instances 5

# View current costs
gcloud billing accounts list
```

**Estimated Monthly Costs (light usage):**
- Cloud Run: $0-20 (with scale-to-zero)
- Secret Manager: $0.06 per secret
- Cloud Build: 120 free build-minutes/day
- Container Registry: $0.026 per GB stored

---

## 📚 File Reference

- `Dockerfile` - Multi-stage production build
- `cloudbuild.yaml` - Automated deployment config
- `.dockerignore` - Excludes files from Docker build
- `.gcloudignore` - Excludes files from gcloud deployments
- `scripts/setup-gcp-secrets.sh` - Automated secret setup
- `src/app/api/health/route.ts` - Health check endpoint
- `DEPLOY.md` - Complete deployment guide

---

## 🆘 Need Help?

1. Check [DEPLOY.md](./DEPLOY.md) for detailed instructions
2. Review [CLAUDE.md](./CLAUDE.md) for application architecture
3. Check Cloud Run logs for errors
4. Verify all secrets are configured correctly

---

## 🎯 Post-Deployment Tasks

After successful deployment:

1. **Update Firebase:**
   ```
   Add your Cloud Run URL to Firebase Console > Authorized Domains
   ```

2. **Test the deployment:**
   ```bash
   curl https://YOUR_CLOUD_RUN_URL/api/health
   ```

3. **Update NEXT_PUBLIC_APP_URL:**
   ```bash
   echo -n "https://YOUR_CLOUD_RUN_URL" | gcloud secrets versions add NEXT_PUBLIC_APP_URL --data-file=-
   ```

4. **Redeploy to pick up new URL:**
   ```bash
   git commit --allow-empty -m "chore: update app URL"
   git push origin main
   ```

---

**Quick Links:**
- [Cloud Run Console](https://console.cloud.google.com/run)
- [Cloud Build Console](https://console.cloud.google.com/cloud-build/builds)
- [Secret Manager](https://console.cloud.google.com/security/secret-manager)
- [Firebase Console](https://console.firebase.google.com/)
