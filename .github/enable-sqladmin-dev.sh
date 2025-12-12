#!/bin/bash
# Enable Cloud SQL Admin API and grant permissions to dev service account

set -e

echo "🔧 Enabling Cloud SQL Admin API..."
gcloud services enable sqladmin.googleapis.com \
  --project=storycare-dev-479511

echo ""
echo "🔑 Granting Cloud SQL Admin role to service account..."
gcloud projects add-iam-policy-binding storycare-dev-479511 \
  --member="serviceAccount:github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com" \
  --role="roles/cloudsql.admin"

echo ""
echo "✅ Done! Verifying permissions..."
echo ""
gcloud projects get-iam-policy storycare-dev-479511 \
  --flatten="bindings[].members" \
  --filter="bindings.members:github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com" \
  --format="table(bindings.role)"

echo ""
echo "✅ Service account now has Cloud SQL Admin permissions!"
echo "You can now retry your deployment."
