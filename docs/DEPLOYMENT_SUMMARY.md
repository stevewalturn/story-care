# Deployment Setup - Quick Summary

## ✅ What's Been Set Up

You now have **separate dev and production deployments** with simplified secret management!

### 📁 Files Created:

1. **`.github/workflows/deploy-dev.yml`** - Dev deployment workflow
2. **`.github/workflows/deploy-prod.yml`** - Production deployment workflow
3. **`create-env-for-github.sh`** - Helper script to generate env files
4. **`DEV_PROD_DEPLOYMENT_GUIDE.md`** - Complete deployment guide
5. **`SIMPLIFIED_GITHUB_SETUP.md`** - Simplified secrets guide
6. **`UPDATE_GITHUB_SECRETS.md`** - Original WIF setup guide

---

## 🚀 Quick Start (3 Steps)

### Step 1: Generate Environment Files

```bash
./create-env-for-github.sh
```

This creates:
- `.env.github.dev` - For development
- `.env.github.prod` - For production

### Step 2: Add GitHub Secrets

Go to: **https://github.com/akbar904/story-care/settings/secrets/actions**

Add these **5 secrets**:

| Secret Name | Value |
|------------|-------|
| `GCP_PROJECT_ID` | `storycare-478114` |
| `WIF_PROVIDER` | `projects/832961952490/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider` |
| `WIF_SERVICE_ACCOUNT` | `github-actions@storycare-478114.iam.gserviceaccount.com` |
| `ENV_FILE_DEV` | Copy from script output |
| `ENV_FILE_PROD` | Copy from script output |

### Step 3: Set Up Workload Identity Federation

```bash
export PROJECT_ID=storycare-478114
export PROJECT_NUMBER=832961952490

# Create WIF pool and provider
gcloud iam workload-identity-pools create "github-actions-pool" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --display-name="GitHub Actions Pool"

gcloud iam workload-identity-pools providers create-oidc "github-actions-provider" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github-actions-pool" \
  --display-name="GitHub Actions Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository_owner == 'akbar904'" \
  --issuer-uri="https://token.actions.githubusercontent.com"

gcloud iam service-accounts add-iam-policy-binding \
  "github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-actions-pool/attribute.repository/akbar904/story-care"
```

---

## 🎯 How It Works

### Development Deployment (Automatic)

**Triggers:** Push to `main` branch

```bash
git add .
git commit -m "feat: new feature"
git push origin main
```

Deploys to: `storycare-app-dev` (2Gi RAM, 1 CPU)

### Production Deployment (Manual or Release)

**Option 1: Manual Trigger**
1. Go to: https://github.com/akbar904/story-care/actions
2. Click "Deploy to Cloud Run (Production)"
3. Click "Run workflow"
4. Select `main` branch
5. Click "Run workflow" button

**Option 2: Create Release**
```bash
git tag v1.0.0
git push origin v1.0.0
```
Or create release in GitHub UI

Deploys to: `storycare-app` (4Gi RAM, 2 CPU)

---

## 📊 Deployment Comparison

| Feature | Dev | Production |
|---------|-----|-----------|
| **Service Name** | `storycare-app-dev` | `storycare-app` |
| **Trigger** | Push to `main` (automatic) | Manual or Release tag |
| **GitHub Secret** | `ENV_FILE_DEV` | `ENV_FILE_PROD` |
| **Memory** | 2Gi | 4Gi |
| **CPU** | 1 | 2 |
| **Max Instances** | 5 | 10 |
| **Min Instances** | 0 (scales to zero) | 1 (always warm) |
| **Environment** | development | production |

---

## 🔑 Required GitHub Secrets

**Only 5 secrets needed!** (Instead of 15+)

```
✓ GCP_PROJECT_ID
✓ WIF_PROVIDER
✓ WIF_SERVICE_ACCOUNT
✓ ENV_FILE_DEV
✓ ENV_FILE_PROD
```

---

## 📝 What's in ENV_FILE_DEV and ENV_FILE_PROD?

Build-time environment variables:
- `NEXT_PUBLIC_FIREBASE_*` - Firebase config (public)
- `NEXT_PUBLIC_APP_URL` - App URL
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN (optional)
- `NEXT_PUBLIC_POSTHOG_*` - PostHog config (optional)
- `DATABASE_URL` - Database URL (for migrations)

**NOT included** (loaded from GCP Secret Manager at runtime):
- API keys (OpenAI, Deepgram, etc.)
- Private Firebase credentials
- GCS credentials
- Other sensitive secrets

---

## 🔄 Typical Workflow

```
1. Work on main branch
   ↓
2. Push to main → Automatic Deploy to Dev
   ↓
3. Test in Dev environment
   ↓
4. When ready for Production:
   - Option A: Manually trigger prod deployment
   - Option B: Create release tag (v1.0.0)
   ↓
5. Deploy to Production
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `DEPLOYMENT_SUMMARY.md` | This file - quick overview |
| `DEV_PROD_DEPLOYMENT_GUIDE.md` | Complete guide with examples |
| `SIMPLIFIED_GITHUB_SETUP.md` | Original simplified guide |
| `UPDATE_GITHUB_SECRETS.md` | WIF setup instructions |
| `GITHUB_ACTIONS_SETUP.md` | Full GitHub Actions guide |

---

## 🐛 Troubleshooting

### Deployment Failed?

1. Check GitHub Actions logs: https://github.com/akbar904/story-care/actions
2. Verify all 5 secrets are added to GitHub
3. Ensure WIF is set up correctly
4. Check Cloud Run logs in GCP Console

### Need to Update Env Vars?

```bash
# 1. Edit your .env.local or .env.production
nano .env.local

# 2. Generate new env files
./create-env-for-github.sh

# 3. Update GitHub secrets with new values
# 4. Push to trigger redeployment
```

### Want to Test WIF Setup?

```bash
# Verify WIF provider exists
gcloud iam workload-identity-pools providers describe "github-actions-provider" \
  --project="storycare-478114" \
  --location="global" \
  --workload-identity-pool="github-actions-pool"
```

---

## 🎉 Next Steps

1. ✅ Run `./create-env-for-github.sh`
2. ✅ Add 5 secrets to GitHub
3. ✅ Run WIF setup commands
4. ✅ Create `dev` branch
5. ✅ Push to `dev` to test dev deployment
6. ✅ Push to `main` to test prod deployment

---

## 📞 Quick Links

- **GitHub Secrets:** https://github.com/akbar904/story-care/settings/secrets/actions
- **GitHub Actions:** https://github.com/akbar904/story-care/actions
- **GCP Console:** https://console.cloud.google.com/run?project=storycare-478114
- **Cloud Run Services:** https://console.cloud.google.com/run?project=storycare-478114&region=us-central1

---

**Repository:** akbar904/story-care
**Project ID:** storycare-478114
**Last Updated:** 2025-01-15
