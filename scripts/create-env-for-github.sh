#!/bin/bash

# This script creates separate .env files for dev and prod environments
# that you can copy-paste as GitHub Secrets (ENV_FILE_DEV and ENV_FILE_PROD)

echo "================================================"
echo "Creating ENV_FILE for GitHub Secrets"
echo "================================================"
echo ""

# Function to create env file from source
create_env_file() {
  local source_file=$1
  local output_file=$2
  local env_name=$3

  if [ ! -f "$source_file" ]; then
    echo "⚠️  Warning: $source_file not found, skipping $env_name"
    return 1
  fi

  # Copy only build-time variables (NEXT_PUBLIC_* and DATABASE_URL)
  # These are needed during Docker build
  local env_upper=$(echo "$env_name" | tr '[:lower:]' '[:upper:]')
  echo "# Build-time environment variables for Docker build ($env_name)" > "$output_file"
  echo "# This file should be copied to GitHub Secret: ENV_FILE_${env_upper}" >> "$output_file"
  echo "" >> "$output_file"

  # Extract NEXT_PUBLIC_* variables
  grep "^NEXT_PUBLIC_" "$source_file" >> "$output_file" 2>/dev/null

  # Extract DATABASE_URL (needed for migrations during build)
  grep "^DATABASE_URL=" "$source_file" >> "$output_file" 2>/dev/null

  echo "✅ Created $output_file with $env_name build-time variables"
  return 0
}

# Create dev env file
if create_env_file ".env.local" ".env.github.dev" "dev"; then
  echo ""
  echo "================================================"
  echo "DEV ENVIRONMENT - ENV_FILE_DEV"
  echo "================================================"
  echo ""
  echo "Secret Name: ENV_FILE_DEV"
  echo ""
  echo "Secret Value:"
  echo "------- START COPYING FROM HERE -------"
  cat ".env.github.dev"
  echo "------- STOP COPYING HERE -------"
  echo ""
fi

# Create prod env file (if .env.production exists, otherwise use .env.local)
echo ""
if [ -f ".env.production" ]; then
  create_env_file ".env.production" ".env.github.prod" "prod"
else
  echo "⚠️  .env.production not found, using .env.local for production"
  create_env_file ".env.local" ".env.github.prod" "prod"
fi

if [ -f ".env.github.prod" ]; then
  echo ""
  echo "================================================"
  echo "PRODUCTION ENVIRONMENT - ENV_FILE_PROD"
  echo "================================================"
  echo ""
  echo "Secret Name: ENV_FILE_PROD"
  echo ""
  echo "Secret Value:"
  echo "------- START COPYING FROM HERE -------"
  cat ".env.github.prod"
  echo "------- STOP COPYING HERE -------"
  echo ""
fi

echo ""
echo "================================================"
echo "HOW TO ADD THESE SECRETS TO GITHUB:"
echo "================================================"
echo ""
echo "1. Go to: https://github.com/akbar904/story-care/settings/secrets/actions"
echo "2. Click 'New repository secret'"
echo "3. Add TWO secrets:"
echo ""
echo "   Secret #1:"
echo "   - Name: ENV_FILE_DEV"
echo "   - Value: Copy the DEV content above"
echo ""
echo "   Secret #2:"
echo "   - Name: ENV_FILE_PROD"
echo "   - Value: Copy the PROD content above"
echo ""
echo "================================================"
echo "OTHER REQUIRED GITHUB SECRETS:"
echo "================================================"
echo ""
echo "You still need to add these secrets individually:"
echo ""
echo "- GCP_PROJECT_ID = storycare-478114"
echo "- WIF_PROVIDER = projects/832961952490/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider"
echo "- WIF_SERVICE_ACCOUNT = github-actions@storycare-478114.iam.gserviceaccount.com"
echo ""
echo "OR (if not using WIF yet):"
echo ""
echo "- GCP_SA_KEY = (contents of github-actions-key.json)"
echo ""
echo "================================================"
echo "DEPLOYMENT WORKFLOWS:"
echo "================================================"
echo ""
echo "Dev Deployment:"
echo "  - Triggers on: push to 'dev', 'develop', or 'feature/*' branches"
echo "  - Uses: ENV_FILE_DEV"
echo "  - Service: storycare-app-dev"
echo ""
echo "Prod Deployment:"
echo "  - Triggers on: push to 'main' branch"
echo "  - Uses: ENV_FILE_PROD"
echo "  - Service: storycare-app"
echo ""
