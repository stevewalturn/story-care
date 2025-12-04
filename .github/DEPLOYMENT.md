# Deployment Quick Reference

Quick guide for deploying StoryCare to development and production environments using GitHub Actions.

---

## 🚀 Quick Deploy

### Development (Automatic)

Push to `main` branch and deployment happens automatically:

```bash
git add .
git commit -m "feat: your changes"
git push origin main
```

✅ **Auto-deploys to:** `storycare-app-dev` (Dev Project)

### Production (Manual)

1. Go to **Actions** tab on GitHub
2. Select **Deploy to Production** workflow
3. Click **Run workflow**
4. Type `deploy` in confirmation field
5. Click **Run workflow** button

✅ **Deploys to:** `storycare-app` (Prod Project)

---

## 🔧 Required GitHub Secrets

### Development Secrets
```
ENV_FILE_DEV                        # Complete .env.dev file
GCP_PROJECT_ID_DEV                  # storycare-dev-479511
GCP_SERVICE_ACCOUNT_DEV             # github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com
GCP_WORKLOAD_IDENTITY_PROVIDER_DEV  # projects/.../providers/github-actions-provider
```

### Production Secrets
```
ENV_FILE_PROD                       # Complete .env.production file
GCP_PROJECT_ID_PROD                 # storycare-478114
GCP_SERVICE_ACCOUNT_PROD            # github-actions-prod@storycare-478114.iam.gserviceaccount.com
GCP_WORKLOAD_IDENTITY_PROVIDER_PROD # projects/.../providers/github-actions-provider
```

---

## 📝 Updating Environment Variables

### Update Development Environment

1. Edit your local `.env.dev` file with new values
2. Copy the **entire file contents**
3. Go to GitHub: **Settings** → **Secrets and variables** → **Actions**
4. Find `ENV_FILE_DEV` secret
5. Click **Update** (pencil icon)
6. Paste the entire file contents
7. Click **Update secret**

**Next deployment will use the new values!**

### Update Production Environment

1. Edit your local `.env.production` file with new values
2. Copy the **entire file contents**
3. Go to GitHub: **Settings** → **Secrets and variables** → **Actions**
4. Find `ENV_FILE_PROD` secret
5. Click **Update** (pencil icon)
6. Paste the entire file contents
7. Click **Update secret**

**Next manual deployment will use the new values!**

### Important Notes for Multi-line Secrets

When copying `.env` files with private keys, keep the `\n` characters:

```bash
# Correct format:
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQI...\n-----END PRIVATE KEY-----\n"

# Don't modify these - copy as-is!
```

---

## 🔍 Check Deployment Status

### View in GitHub

1. Go to **Actions** tab
2. Click on the workflow run
3. Expand steps to see logs
4. Check summary for deployment URL

### Get Service URLs

```bash
# Development URL
gcloud run services describe storycare-app-dev \
  --project=storycare-dev-479511 \
  --region=us-central1 \
  --format='value(status.url)'

# Production URL
gcloud run services describe storycare-app \
  --project=storycare-478114 \
  --region=us-central1 \
  --format='value(status.url)'
```

---

## 🐛 Quick Troubleshooting

### Deployment Failed - "Permission denied"

```bash
# Re-grant permissions (choose dev or prod)
gcloud projects add-iam-policy-binding storycare-dev-479511 \
  --member="serviceAccount:github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com" \
  --role="roles/run.admin"
```

### Deployment Failed - "Invalid credentials"

1. Check that `ENV_FILE_DEV` or `ENV_FILE_PROD` is correctly formatted
2. Ensure entire .env file was copied (not truncated)
3. Verify no extra spaces or line breaks were added

### Health Check Failed

1. Go to **Cloud Run** in GCP Console
2. Select the failed service
3. Click **Logs** tab
4. Look for startup errors or missing environment variables

### Production Workflow Won't Start

Make sure you typed exactly `deploy` (lowercase) in the confirmation field.

---

## 📊 Environments Overview

| Environment | Branch | GCP Project | Service Name | Deployment |
|------------|--------|-------------|--------------|------------|
| **Development** | `main` | `storycare-dev-479511` | `storycare-app-dev` | Automatic |
| **Production** | Manual | `storycare-478114` | `storycare-app` | Manual only |

---

## 🔐 Security Notes

- ✅ Never commit `.env` files to git
- ✅ Keep GitHub Secrets up to date
- ✅ Use Workload Identity Federation (no long-lived keys)
- ✅ Separate dev and prod projects for isolation
- ✅ Manual production deployments for control
- ✅ Always review changes before deploying to prod

---

## 📚 More Documentation

- **Full Setup Guide:** See `GITHUB_ACTIONS_SETUP.md`
- **GCS Setup:** See `SETUP_GOOGLE_CLOUD_STORAGE.md`
- **Dev/Prod Guide:** See `DEV_PROD_DEPLOYMENT_GUIDE.md`

---

## 🎯 Common Tasks

### Roll Back Production

If you need to roll back to a previous version:

```bash
# 1. Find previous image
gcloud container images list-tags gcr.io/storycare-478114/storycare-app --limit=10

# 2. Deploy specific image
gcloud run deploy storycare-app \
  --image gcr.io/storycare-478114/storycare-app:COMMIT_SHA \
  --project=storycare-478114 \
  --region=us-central1
```

### View Logs

```bash
# Development logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=storycare-app-dev" \
  --project=storycare-dev-479511 \
  --limit=50

# Production logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=storycare-app" \
  --project=storycare-478114 \
  --limit=50
```

### Check Resource Usage

```bash
# Development metrics
gcloud run services describe storycare-app-dev \
  --project=storycare-dev-479511 \
  --region=us-central1

# Production metrics
gcloud run services describe storycare-app \
  --project=storycare-478114 \
  --region=us-central1
```

---

## 💡 Pro Tips

1. **Test in Dev First:** Always deploy and test changes in development before production
2. **Monitor Logs:** Keep an eye on Cloud Run logs after deployments
3. **Health Checks:** The `/api/health` endpoint must respond for successful deployment
4. **Environment Parity:** Keep dev and prod environments as similar as possible
5. **Document Changes:** Update environment variable documentation when adding new secrets

---

**Quick Links:**
- [GitHub Actions](https://github.com/akbar904/story-care/actions)
- [Dev Cloud Run](https://console.cloud.google.com/run?project=storycare-dev-479511)
- [Prod Cloud Run](https://console.cloud.google.com/run?project=storycare-478114)

---

**Last Updated:** 2025-12-03
**Version:** 1.0.0
