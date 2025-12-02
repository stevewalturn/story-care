# GCloud Commands for StoryCare Setup

Copy and paste these commands to set up GCS access for your Cloud Run service.

## Find Your Actual Service Accounts

```bash
export PROJECT_ID="storycare-478114"

# Get your project number
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
echo "Project Number: $PROJECT_NUMBER"

# Find the default compute service account
export COMPUTE_SA="$PROJECT_NUMBER-compute@developer.gserviceaccount.com"
echo "Compute Service Account: $COMPUTE_SA"

# Or list all service accounts to see what you have
gcloud iam service-accounts list

# Check what service account your Cloud Run is currently using
gcloud run services describe storycare-app-dev --region=us-central1 --format="value(spec.template.spec.serviceAccountName)"
```

## Set Variables

```bash
export PROJECT_ID="storycare-478114"
export BUCKET_NAME="storycare-dev-media"
export CLOUD_RUN_SERVICE="storycare-app-dev"
export REGION="us-central1"

# Use the compute SA we found above
export COMPUTE_SA="$PROJECT_NUMBER-compute@developer.gserviceaccount.com"
```

## Give Cloud Run Service Access to GCS Bucket

```bash
# Set project
gcloud config set project $PROJECT_ID

# Grant storage permissions to compute service account (what Cloud Run actually uses)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$COMPUTE_SA" \
    --role="roles/storage.objectAdmin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$COMPUTE_SA" \
    --role="roles/storage.objectViewer"

# Make sure Cloud Run uses the compute service account (default)
gcloud run services update $CLOUD_RUN_SERVICE \
    --service-account=$COMPUTE_SA \
    --region=$REGION

# Set bucket permissions directly (backup)
gsutil iam ch serviceAccount:$COMPUTE_SA:objectAdmin gs://$BUCKET_NAME
```

## Verify Access

```bash
# Check service account permissions
gcloud projects get-iam-policy $PROJECT_ID \
    --flatten="bindings[].members" \
    --format="table(bindings.role)" \
    --filter="bindings.members:$COMPUTE_SA"

# Check bucket permissions
gsutil iam get gs://$BUCKET_NAME

# Test bucket access
gsutil ls gs://$BUCKET_NAME
```

## Environment Variables for .env

```bash
# Add these to your .env.github.dev and .env.github.prod
echo "GCS_PROJECT_ID=$PROJECT_ID"
echo "GCS_BUCKET_NAME=$BUCKET_NAME"
echo "# No GCS credentials needed - Cloud Run uses compute service account automatically"
```

## Production Commands (if needed)

```bash
export CLOUD_RUN_SERVICE_PROD="storycare-app"

gcloud run services update $CLOUD_RUN_SERVICE_PROD \
    --service-account=$COMPUTE_SA \
    --region=$REGION
```

## Test Access from Cloud Run

Create this test endpoint in your app:

```typescript
// pages/api/test-gcs.ts
import { Storage } from '@google-cloud/storage';

const storage = new Storage(); // No credentials needed in Cloud Run
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME!);

export default async function handler(req, res) {
  try {
    const [files] = await bucket.getFiles();
    res.json({ success: true, fileCount: files.length });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
}
```

That's it. No service account keys needed.