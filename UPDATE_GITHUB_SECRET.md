# Update GitHub Secret ENV_FILE_DEV

## Step 1: Copy the ENV file content

Open the file `.env.github.dev` in this directory and copy ALL the content (including the multi-line private keys).

**IMPORTANT**: The file now includes:
- Firebase Authentication (client-side)
- Firebase Admin SDK (with multi-line private key)
- Google Cloud Storage credentials (with multi-line private key)
- Database URL (Cloud Run unix socket format)
- AI Services (Deepgram, OpenAI, Stability, FAL, Vertex AI, Suno)
- All other API keys from your .env.local

## Step 2: Update GitHub Secret

1. Go to: https://github.com/akbar904/story-care/settings/secrets/actions

2. Find the secret named `ENV_FILE_DEV`

3. Click "Update" (or "Edit")

4. Paste the ENTIRE content from `.env.github.dev` (all 86 lines)

5. Click "Update secret"

## Step 3: Do the same for Production (ENV_FILE_PROD)

You'll need to create a similar file for production with:
- Same Firebase Admin credentials (or production versions if you have a separate Firebase project)
- Production DATABASE_URL: `postgresql://postgres:PASSWORD@/storycare_prod?host=/cloudsql/storycare-478114:us-central1:storycare-prod`
- Production API keys for monitoring services (if different from dev)

## Step 4: Test the deployment

After updating the secrets, push to main branch or manually trigger the workflow to test.

## Important Notes

- The private key MUST be on multiple lines (as shown in the file)
- Do NOT add quotes around the private key in the GitHub secret
- Make sure there are NO comments in the ENV_FILE (comments will break the shell script)
- The current file has NO comments except for section headers (which start with `#`)

## Current GitHub Secrets Setup

You should have these secrets configured:

1. **ENV_FILE_DEV** - All environment variables for dev build (UPDATE THIS NOW)
2. **ENV_FILE_PROD** - All environment variables for prod build (UPDATE THIS LATER)
3. **GCP_PROJECT_ID** - `storycare-478114`
4. **WIF_PROVIDER** - `projects/265535299717/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider`
5. **WIF_SERVICE_ACCOUNT** - `github-actions-sa@storycare-478114.iam.gserviceaccount.com`

## GCP Secret Manager

You should have these secrets in GCP Secret Manager:

1. **DATABASE_URL_DEV** - Connection string for dev database
2. **DATABASE_URL** - Connection string for production database

These are loaded at RUNTIME in Cloud Run, not during the build.
