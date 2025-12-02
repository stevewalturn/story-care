#!/bin/bash

PROJECT_ID="storycare-478114"
SERVICE_ACCOUNT="github-actions@${PROJECT_ID}.iam.gserviceaccount.com"
REPO_NAME="gcr.io"
LOCATION="us"

echo "Creating Artifact Registry repository for GCR..."
echo ""

echo "Step 1: Create the repository..."
gcloud artifacts repositories create $REPO_NAME \
  --repository-format=docker \
  --location=$LOCATION \
  --project=$PROJECT_ID

echo ""
echo "Step 2: Grant writer permission to service account..."
gcloud artifacts repositories add-iam-policy-binding $REPO_NAME \
  --location=$LOCATION \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/artifactregistry.writer" \
  --project=$PROJECT_ID

echo ""
echo "✅ Done! Artifact Registry repository created."
echo "GitHub Actions can now push to gcr.io/${PROJECT_ID}/"
