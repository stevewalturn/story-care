#!/bin/bash

PROJECT_ID="storycare-478114"
SERVICE_ACCOUNT="github-actions@${PROJECT_ID}.iam.gserviceaccount.com"

echo "Enabling required APIs..."
gcloud services enable iamcredentials.googleapis.com --project=$PROJECT_ID
gcloud services enable containerregistry.googleapis.com --project=$PROJECT_ID
gcloud services enable artifactregistry.googleapis.com --project=$PROJECT_ID
gcloud services enable run.googleapis.com --project=$PROJECT_ID
gcloud services enable sqladmin.googleapis.com --project=$PROJECT_ID
gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID

echo ""
echo "Granting Storage Admin role (for GCR push)..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/storage.admin"

echo ""
echo "Granting Cloud Run Admin role (for deployment)..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/run.admin"

echo ""
echo "Granting Service Account User role (to act as Cloud Run service account)..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/iam.serviceAccountUser"

echo ""
echo "Granting Artifact Registry Writer role..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/artifactregistry.writer"

echo ""
echo "Granting Artifact Registry Create-on-Push permission..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/artifactregistry.repoAdmin"

echo ""
echo "Granting Cloud SQL Client role (for Cloud SQL connection)..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/cloudsql.client"

echo ""
echo "Granting Secret Manager Secret Accessor role (for reading DATABASE_URL)..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"

echo ""
echo "✅ Done! All permissions granted:"
echo "  - Storage Admin (push to GCR)"
echo "  - Cloud Run Admin (deploy services)"
echo "  - Service Account User (run as service account)"
echo "  - Artifact Registry Writer (push images)"
echo "  - Artifact Registry Repo Admin (create repos on push)"
echo "  - Cloud SQL Client (connect to Cloud SQL)"
echo "  - Secret Manager Secret Accessor (read DATABASE_URL)"
echo ""
echo "Now retry the GitHub Actions workflow."
