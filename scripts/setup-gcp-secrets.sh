#!/bin/bash

# StoryCare - Google Cloud Secret Manager Setup Script
# This script creates all required secrets in GCP Secret Manager from your .env file
#
# Prerequisites:
# 1. Install gcloud CLI: https://cloud.google.com/sdk/docs/install
# 2. Authenticate: gcloud auth login
# 3. Set project: gcloud config set project YOUR_PROJECT_ID
# 4. Enable Secret Manager API: gcloud services enable secretmanager.googleapis.com
#
# Usage:
#   chmod +x scripts/setup-gcp-secrets.sh
#   ./scripts/setup-gcp-secrets.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env.example ]; then
    echo -e "${RED}Error: .env.example file not found${NC}"
    echo "Please ensure you're running this script from the project root"
    exit 1
fi

# Get current GCP project
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: No GCP project set${NC}"
    echo "Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo -e "${GREEN}Setting up secrets for project: $PROJECT_ID${NC}\n"

# Function to create or update a secret
create_or_update_secret() {
    local secret_name=$1
    local secret_value=$2

    if [ -z "$secret_value" ]; then
        echo -e "${YELLOW}Skipping $secret_name (empty value)${NC}"
        return
    fi

    # Check if secret exists
    if gcloud secrets describe "$secret_name" --project="$PROJECT_ID" >/dev/null 2>&1; then
        echo -e "${YELLOW}Updating existing secret: $secret_name${NC}"
        echo -n "$secret_value" | gcloud secrets versions add "$secret_name" \
            --data-file=- \
            --project="$PROJECT_ID"
    else
        echo -e "${GREEN}Creating new secret: $secret_name${NC}"
        echo -n "$secret_value" | gcloud secrets create "$secret_name" \
            --data-file=- \
            --replication-policy="automatic" \
            --project="$PROJECT_ID"
    fi
}

echo -e "${GREEN}=== Firebase Authentication (Client-side) ===${NC}"
read -p "NEXT_PUBLIC_FIREBASE_API_KEY: " NEXT_PUBLIC_FIREBASE_API_KEY
create_or_update_secret "NEXT_PUBLIC_FIREBASE_API_KEY" "$NEXT_PUBLIC_FIREBASE_API_KEY"

read -p "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: " NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
create_or_update_secret "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" "$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"

read -p "NEXT_PUBLIC_FIREBASE_PROJECT_ID: " NEXT_PUBLIC_FIREBASE_PROJECT_ID
create_or_update_secret "NEXT_PUBLIC_FIREBASE_PROJECT_ID" "$NEXT_PUBLIC_FIREBASE_PROJECT_ID"

read -p "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: " NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
create_or_update_secret "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" "$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"

read -p "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: " NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
create_or_update_secret "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" "$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"

read -p "NEXT_PUBLIC_FIREBASE_APP_ID: " NEXT_PUBLIC_FIREBASE_APP_ID
create_or_update_secret "NEXT_PUBLIC_FIREBASE_APP_ID" "$NEXT_PUBLIC_FIREBASE_APP_ID"

read -p "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: " NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
create_or_update_secret "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID" "$NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID"

echo -e "\n${GREEN}=== Firebase Admin SDK (Server-side) ===${NC}"
read -p "FIREBASE_PROJECT_ID: " FIREBASE_PROJECT_ID
create_or_update_secret "FIREBASE_PROJECT_ID" "$FIREBASE_PROJECT_ID"

read -p "FIREBASE_CLIENT_EMAIL: " FIREBASE_CLIENT_EMAIL
create_or_update_secret "FIREBASE_CLIENT_EMAIL" "$FIREBASE_CLIENT_EMAIL"

echo "FIREBASE_PRIVATE_KEY (paste and press Enter, then Ctrl+D):"
FIREBASE_PRIVATE_KEY=$(cat)
create_or_update_secret "FIREBASE_PRIVATE_KEY" "$FIREBASE_PRIVATE_KEY"

echo -e "\n${GREEN}=== Database ===${NC}"
read -p "DATABASE_URL: " DATABASE_URL
create_or_update_secret "DATABASE_URL" "$DATABASE_URL"

echo -e "\n${GREEN}=== Google Cloud Storage ===${NC}"
read -p "GCS_PROJECT_ID: " GCS_PROJECT_ID
create_or_update_secret "GCS_PROJECT_ID" "$GCS_PROJECT_ID"

read -p "GCS_CLIENT_EMAIL: " GCS_CLIENT_EMAIL
create_or_update_secret "GCS_CLIENT_EMAIL" "$GCS_CLIENT_EMAIL"

echo "GCS_PRIVATE_KEY (paste and press Enter, then Ctrl+D):"
GCS_PRIVATE_KEY=$(cat)
create_or_update_secret "GCS_PRIVATE_KEY" "$GCS_PRIVATE_KEY"

read -p "GCS_BUCKET_NAME: " GCS_BUCKET_NAME
create_or_update_secret "GCS_BUCKET_NAME" "$GCS_BUCKET_NAME"

echo -e "\n${GREEN}=== AI Services (Optional - press Enter to skip) ===${NC}"
read -p "DEEPGRAM_API_KEY: " DEEPGRAM_API_KEY
create_or_update_secret "DEEPGRAM_API_KEY" "$DEEPGRAM_API_KEY"

read -p "SUNO_API_KEY: " SUNO_API_KEY
create_or_update_secret "SUNO_API_KEY" "$SUNO_API_KEY"

read -p "ATLASCLOUD_API_KEY: " ATLASCLOUD_API_KEY
create_or_update_secret "ATLASCLOUD_API_KEY" "$ATLASCLOUD_API_KEY"

read -p "OPENAI_API_KEY: " OPENAI_API_KEY
create_or_update_secret "OPENAI_API_KEY" "$OPENAI_API_KEY"

read -p "GOOGLE_VERTEX_PROJECT_ID: " GOOGLE_VERTEX_PROJECT_ID
create_or_update_secret "GOOGLE_VERTEX_PROJECT_ID" "$GOOGLE_VERTEX_PROJECT_ID"

read -p "GOOGLE_VERTEX_LOCATION (default: us-central1): " GOOGLE_VERTEX_LOCATION
GOOGLE_VERTEX_LOCATION=${GOOGLE_VERTEX_LOCATION:-us-central1}
create_or_update_secret "GOOGLE_VERTEX_LOCATION" "$GOOGLE_VERTEX_LOCATION"

read -p "STABILITY_API_KEY: " STABILITY_API_KEY
create_or_update_secret "STABILITY_API_KEY" "$STABILITY_API_KEY"

read -p "FLUX_API_KEY: " FLUX_API_KEY
create_or_update_secret "FLUX_API_KEY" "$FLUX_API_KEY"

read -p "REPLICATE_API_TOKEN: " REPLICATE_API_TOKEN
create_or_update_secret "REPLICATE_API_TOKEN" "$REPLICATE_API_TOKEN"

echo -e "\n${GREEN}=== Security ===${NC}"
read -p "ARCJET_KEY: " ARCJET_KEY
create_or_update_secret "ARCJET_KEY" "$ARCJET_KEY"

echo -e "\n${GREEN}=== Application ===${NC}"
read -p "NEXT_PUBLIC_APP_URL (e.g., https://storycare-app-xyz.a.run.app): " NEXT_PUBLIC_APP_URL
create_or_update_secret "NEXT_PUBLIC_APP_URL" "$NEXT_PUBLIC_APP_URL"

echo -e "\n${GREEN}=== Monitoring (Optional - press Enter to skip) ===${NC}"
read -p "NEXT_PUBLIC_SENTRY_DSN: " NEXT_PUBLIC_SENTRY_DSN
create_or_update_secret "NEXT_PUBLIC_SENTRY_DSN" "$NEXT_PUBLIC_SENTRY_DSN"

read -p "NEXT_PUBLIC_POSTHOG_KEY: " NEXT_PUBLIC_POSTHOG_KEY
create_or_update_secret "NEXT_PUBLIC_POSTHOG_KEY" "$NEXT_PUBLIC_POSTHOG_KEY"

read -p "NEXT_PUBLIC_POSTHOG_HOST (default: https://us.i.posthog.com): " NEXT_PUBLIC_POSTHOG_HOST
NEXT_PUBLIC_POSTHOG_HOST=${NEXT_PUBLIC_POSTHOG_HOST:-https://us.i.posthog.com}
create_or_update_secret "NEXT_PUBLIC_POSTHOG_HOST" "$NEXT_PUBLIC_POSTHOG_HOST"

read -p "NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN: " NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN
create_or_update_secret "NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN" "$NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN"

echo -e "\n${GREEN}=== All secrets created/updated successfully! ===${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Grant Cloud Build access to secrets:"
echo "   gcloud projects add-iam-policy-binding $PROJECT_ID \\"
echo "     --member=serviceAccount:PROJECT_NUMBER@cloudbuild.gserviceaccount.com \\"
echo "     --role=roles/secretmanager.secretAccessor"
echo ""
echo "2. Grant Cloud Run access to secrets:"
echo "   gcloud projects add-iam-policy-binding $PROJECT_ID \\"
echo "     --member=serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com \\"
echo "     --role=roles/secretmanager.secretAccessor"
echo ""
echo "3. Enable required APIs:"
echo "   gcloud services enable run.googleapis.com cloudbuild.googleapis.com"
echo ""
echo "4. Connect Cloud Build to GitHub and create a trigger"
echo "   https://console.cloud.google.com/cloud-build/triggers"
