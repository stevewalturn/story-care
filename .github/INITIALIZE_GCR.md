# Initialize GCR Repository - First Push Commands

This guide shows you how to create the initial GCR repository by doing a test push from your local machine or Cloud Shell.

---

## Problem

The error "gcr.io repo does not exist. Creating on push requires the artifactregistry.repositories.createOnPush permission" occurs because:
- GCR requires the repository to be initialized with a first push
- The repository `gcr.io/storycare-dev-479511` doesn't exist yet

---

## Solution: Initialize GCR with First Push

You have **3 options** to initialize the GCR repository:

---

## Option 1: Using Cloud Shell (Easiest - No Local Setup Required)

### Step 1: Open Cloud Shell
1. Go to https://console.cloud.google.com
2. Click the Cloud Shell icon (top right, looks like `>_`)
3. Wait for Cloud Shell to start

### Step 2: Set Project and Authenticate
```bash
# Set the project
gcloud config set project storycare-dev-479511

# Authenticate
gcloud auth configure-docker gcr.io
```

### Step 3: Pull, Tag, and Push a Test Image
```bash
# Pull a tiny test image (hello-world is ~2KB)
docker pull hello-world

# Tag it for your GCR
docker tag hello-world gcr.io/storycare-dev-479511/init:latest

# Push to GCR (this initializes the repository)
docker push gcr.io/storycare-dev-479511/init:latest
```

### Step 4: Verify It Worked
```bash
# List GCR images
gcloud container images list --project=storycare-dev-479511

# You should see:
# NAME
# gcr.io/storycare-dev-479511/init
```

### Step 5: Clean Up (Optional)
```bash
# Delete the test image
gcloud container images delete gcr.io/storycare-dev-479511/init:latest --quiet
```

---

## Option 2: Using Your Local Machine (If Docker is Installed)

### Step 1: Authenticate
```bash
# Login to gcloud
gcloud auth login

# Set project
gcloud config set project storycare-dev-479511

# Configure Docker
gcloud auth configure-docker gcr.io
```

### Step 2: Pull, Tag, and Push
```bash
# Pull test image
docker pull hello-world

# Tag for GCR
docker tag hello-world gcr.io/storycare-dev-479511/init:latest

# Push to initialize GCR
docker push gcr.io/storycare-dev-479511/init:latest
```

### Step 3: Verify
```bash
gcloud container images list --project=storycare-dev-479511
```

---

## Option 3: Using Cloud Build (No Docker Required)

### Step 1: Enable Cloud Build API
```bash
gcloud services enable cloudbuild.googleapis.com --project=storycare-dev-479511
```

### Step 2: Create a Simple Build Config
```bash
cat > /tmp/init-gcr.yaml << 'EOF'
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['pull', 'hello-world']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['tag', 'hello-world', 'gcr.io/storycare-dev-479511/init:latest']
images:
  - 'gcr.io/storycare-dev-479511/init:latest'
EOF
```

### Step 3: Run the Build
```bash
gcloud builds submit --config=/tmp/init-gcr.yaml --no-source --project=storycare-dev-479511
```

This will:
1. Pull the `hello-world` image
2. Tag it for your GCR
3. Push it to GCR (initializing the repository)

### Step 4: Verify
```bash
gcloud container images list --project=storycare-dev-479511
```

---

## After GCR is Initialized

Once you've completed ANY of the above options, your GCR will be initialized and ready.

### What Happens Next:

1. **GitHub Actions will work** - Your workflow can now push images to GCR
2. **Repository exists** - `gcr.io/storycare-dev-479511` is now active
3. **Auto-creation works** - New image names under this project will be created automatically

### Test Your Workflow:

```bash
git add .
git commit -m "test: verify GCR push after initialization"
git push origin main
```

The deployment should now succeed! 🎉

---

## Why This is Needed

### GCR (gcr.io) vs Artifact Registry
- **GCR**: Requires project-level initialization (first push creates the root)
- **Artifact Registry**: Requires explicit repository creation

### The First Push:
- First push to `gcr.io/PROJECT_ID` initializes the GCR backend
- Creates the necessary Cloud Storage buckets
- Sets up metadata and permissions

---

## Troubleshooting

### "Permission denied" when pushing
```bash
# Re-authenticate
gcloud auth login
gcloud auth configure-docker gcr.io
```

### "Project not found"
```bash
# Verify project ID
gcloud projects list
gcloud config set project storycare-dev-479511
```

### "Docker not found" in Cloud Shell
```bash
# Docker is pre-installed in Cloud Shell, but verify:
docker --version
```

### Still getting "repo does not exist" after initialization
```bash
# Wait 30 seconds for propagation, then verify:
gcloud container images list --project=storycare-dev-479511

# If empty, try pushing again:
docker push gcr.io/storycare-dev-479511/init:latest
```

---

## Quick Reference Commands

### Initialize GCR (One-liner for Cloud Shell):
```bash
docker pull hello-world && \
docker tag hello-world gcr.io/storycare-dev-479511/init:latest && \
gcloud auth configure-docker gcr.io && \
docker push gcr.io/storycare-dev-479511/init:latest
```

### Verify Initialization:
```bash
gcloud container images list --project=storycare-dev-479511
```

### Clean Up Test Image:
```bash
gcloud container images delete gcr.io/storycare-dev-479511/init:latest --quiet
```

---

## What This Accomplishes

After running these commands:

✅ GCR is initialized for `storycare-dev-479511`
✅ Cloud Storage buckets are created automatically
✅ GitHub Actions can push images to `gcr.io/storycare-dev-479511/*`
✅ No more "repo does not exist" errors

---

## For Production

When you set up production, repeat this process:

```bash
# Set production project
gcloud config set project YOUR_PROD_PROJECT_ID

# Configure Docker
gcloud auth configure-docker gcr.io

# Initialize GCR
docker pull hello-world
docker tag hello-world gcr.io/YOUR_PROD_PROJECT_ID/init:latest
docker push gcr.io/YOUR_PROD_PROJECT_ID/init:latest

# Verify
gcloud container images list --project=YOUR_PROD_PROJECT_ID
```

---

**Last Updated**: 2025-12-11
**Estimated Time**: 2-5 minutes
**Recommended**: Use Cloud Shell (Option 1) - fastest and requires no local setup
