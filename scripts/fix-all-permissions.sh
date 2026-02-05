#!/bin/bash

PROJECT_ID="storycare-478114"
PROJECT_NUMBER="832961952490"
SERVICE_ACCOUNT="github-actions@${PROJECT_ID}.iam.gserviceaccount.com"
POOL_NAME="github-actions-pool"
PROVIDER_NAME="github-actions-provider"
REPO="akbar904/story-care"

echo "=========================================="
echo "Complete GitHub Actions → Cloud Run Setup"
echo "=========================================="
echo ""

echo "1. Enabling ALL required APIs..."
gcloud services enable iamcredentials.googleapis.com --project=$PROJECT_ID
gcloud services enable sts.googleapis.com --project=$PROJECT_ID
gcloud services enable containerregistry.googleapis.com --project=$PROJECT_ID
gcloud services enable artifactregistry.googleapis.com --project=$PROJECT_ID
gcloud services enable run.googleapis.com --project=$PROJECT_ID
gcloud services enable sqladmin.googleapis.com --project=$PROJECT_ID
gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID
gcloud services enable cloudresourcemanager.googleapis.com --project=$PROJECT_ID
gcloud services enable compute.googleapis.com --project=$PROJECT_ID

echo ""
echo "2. Granting Storage Admin (GCR push)..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/storage.admin"

echo ""
echo "3. Granting Cloud Run Admin (deployment)..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/run.admin"

echo ""
echo "4. Granting Service Account User (act as service account)..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/iam.serviceAccountUser"

echo ""
echo "5. Granting Artifact Registry Writer (push images)..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/artifactregistry.writer"

echo ""
echo "6. Granting Artifact Registry Repo Admin (create repos)..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/artifactregistry.repoAdmin"

echo ""
echo "7. Granting Cloud SQL Client (connect to Cloud SQL)..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/cloudsql.client"

echo ""
echo "8. Granting Secret Manager Secret Accessor (read secrets)..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"

echo ""
echo "9. Granting Viewer (read project resources)..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/viewer"

echo ""
echo "10. Granting Compute Instance Admin (for Cloud Run backend)..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/compute.instanceAdmin.v1"

echo ""
echo "11. Granting Workload Identity User (WIF authentication)..."
gcloud iam service-accounts add-iam-policy-binding ${SERVICE_ACCOUNT} \
  --project=$PROJECT_ID \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_NAME}/attribute.repository/${REPO}"

echo ""
echo "=========================================="
echo "✅ All permissions granted!"
echo "=========================================="
echo ""
echo "Roles granted to ${SERVICE_ACCOUNT}:"
echo "  1. Storage Admin (GCR push)"
echo "  2. Cloud Run Admin (deploy services)"
echo "  3. Service Account User (act as service account)"
echo "  4. Artifact Registry Writer (push images)"
echo "  5. Artifact Registry Repo Admin (create repos)"
echo "  6. Cloud SQL Client (connect to database)"
echo "  7. Secret Manager Secret Accessor (read secrets)"
echo "  8. Viewer (read project resources)"
echo "  9. Compute Instance Admin (Cloud Run backend)"
echo "  10. Workload Identity User (WIF auth)"
echo ""
echo "Now retry the GitHub Actions workflow!"
