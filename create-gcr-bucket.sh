#!/bin/bash

PROJECT_ID="storycare-478114"
SERVICE_ACCOUNT="github-actions@${PROJECT_ID}.iam.gserviceaccount.com"

echo "Option 1: Grant Storage Object Admin + Storage Admin (create buckets)..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/storage.objectAdmin"

echo ""
echo "Option 2: Manually create GCR bucket (easier)..."
echo "Just push any image once from your local machine:"
echo ""
echo "  gcloud auth configure-docker"
echo "  docker tag hello-world gcr.io/${PROJECT_ID}/test:latest"
echo "  docker push gcr.io/${PROJECT_ID}/test:latest"
echo ""
echo "This will auto-create the GCR bucket, then GitHub Actions can push to it."
