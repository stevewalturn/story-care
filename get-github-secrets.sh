#!/bin/bash

# Script to display environment variables for GitHub Secrets
# This makes it easy to copy values to GitHub Secrets one by one

echo "=========================================="
echo "GitHub Secrets Helper"
echo "=========================================="
echo ""
echo "Copy these values to GitHub Secrets:"
echo "https://github.com/akbar904/story-care/settings/secrets/actions"
echo ""
echo "=========================================="
echo "WORKLOAD IDENTITY FEDERATION (WIF)"
echo "=========================================="
echo ""
echo "Secret Name: GCP_PROJECT_ID"
echo "Value: storycare-478114"
echo ""
echo "Secret Name: WIF_SERVICE_ACCOUNT"
echo "Value: github-actions@storycare-478114.iam.gserviceaccount.com"
echo ""
echo "Secret Name: WIF_PROVIDER"
echo "Value: projects/832961952490/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider"
echo ""

if [ -f ".env.local" ]; then
  echo "=========================================="
  echo "FIREBASE CONFIGURATION"
  echo "=========================================="
  echo ""

  # Extract Firebase values
  while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue

    # Only show Firebase-related vars
    if [[ "$key" =~ ^NEXT_PUBLIC_FIREBASE ]]; then
      # Remove quotes if present
      value="${value//\"/}"
      value="${value//\'/}"
      echo "Secret Name: $key"
      echo "Value: $value"
      echo ""
    fi
  done < .env.local

  echo "=========================================="
  echo "DATABASE"
  echo "=========================================="
  echo ""

  # Extract Database URL
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue

    if [[ "$key" == "DATABASE_URL" ]]; then
      value="${value//\"/}"
      value="${value//\'/}"
      echo "Secret Name: DATABASE_URL"
      echo "Value: $value"
      echo ""
    fi
  done < .env.local

  echo "=========================================="
  echo "OTHER PUBLIC VARIABLES"
  echo "=========================================="
  echo ""

  # Extract other NEXT_PUBLIC vars
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue

    # Show non-Firebase NEXT_PUBLIC vars
    if [[ "$key" =~ ^NEXT_PUBLIC ]] && [[ ! "$key" =~ FIREBASE ]]; then
      value="${value//\"/}"
      value="${value//\'/}"
      echo "Secret Name: $key"
      echo "Value: $value"
      echo ""
    fi
  done < .env.local

else
  echo "⚠️  .env.local file not found!"
  echo ""
  echo "Please create .env.local with your environment variables."
  echo ""
fi

echo "=========================================="
echo "NEXT STEPS"
echo "=========================================="
echo ""
echo "1. Copy each secret above to GitHub:"
echo "   https://github.com/akbar904/story-care/settings/secrets/actions"
echo ""
echo "2. Run the WIF setup commands from UPDATE_GITHUB_SECRETS.md"
echo ""
echo "3. Update the workflow file to use WIF (see UPDATE_GITHUB_SECRETS.md)"
echo ""
echo "4. Push to main branch to trigger deployment"
echo ""
