#!/bin/bash
# Fix Cloud SQL cross-project access

set -e

echo "🔍 Identifying the Cloud Run service account..."
echo ""

# The Cloud Run service account is typically:
# PROJECT_NUMBER-compute@developer.gserviceaccount.com
# For storycare-dev-479511, that's: 780029180736-compute@developer.gserviceaccount.com

CLOUD_RUN_SA="780029180736-compute@developer.gserviceaccount.com"
SQL_PROJECT="storycare-478114"
SQL_INSTANCE="storycare-dev"

echo "Cloud Run Service Account: $CLOUD_RUN_SA"
echo "Cloud SQL Project: $SQL_PROJECT"
echo "Cloud SQL Instance: $SQL_INSTANCE"
echo ""

echo "🔑 Granting Cloud SQL Client permission on the SQL instance project..."
gcloud projects add-iam-policy-binding $SQL_PROJECT \
  --member="serviceAccount:$CLOUD_RUN_SA" \
  --role="roles/cloudsql.client"

echo ""
echo "✅ Done! The Cloud Run service can now connect to Cloud SQL instance."
echo ""
echo "Verify with:"
echo "gcloud projects get-iam-policy $SQL_PROJECT \\"
echo "  --flatten=\"bindings[].members\" \\"
echo "  --filter=\"bindings.members:$CLOUD_RUN_SA\" \\"
echo "  --format=\"table(bindings.role)\""
