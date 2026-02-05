#!/bin/bash

PROJECT_ID="storycare-478114"
SERVICE_ACCOUNT="github-actions@${PROJECT_ID}.iam.gserviceaccount.com"

echo "Granting Artifact Registry Admin role..."
echo "This includes the createOnPush permission needed for GCR."
echo ""

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/artifactregistry.admin"

echo ""
echo "✅ Done! The service account can now:"
echo "  - Create GCR repositories on first push"
echo "  - Push Docker images to GCR"
echo "  - Manage Artifact Registry repositories"
echo ""
echo "Retry the GitHub Actions workflow now!"
