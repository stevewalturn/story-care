#!/bin/bash

# Deploy Video Processor to Cloud Run
# Usage: ./scripts/deploy-video-processor.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deploy Video Processor to Cloud Run  ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Configuration
PROJECT_ID=${GCP_PROJECT_ID:-"storycare-478114"}
SERVICE_NAME="storycare-video-processor"
REGION="us-central1"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "   Project ID: $PROJECT_ID"
echo "   Service: $SERVICE_NAME"
echo "   Region: $REGION"
echo ""

# Check prerequisites
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"

if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Error: gcloud CLI not found${NC}"
    echo "   Install: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Error: Docker not found${NC}"
    echo "   Install: https://docs.docker.com/get-docker/"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites satisfied${NC}"
echo ""

# Set project
echo -e "${YELLOW}🔧 Setting GCP project...${NC}"
gcloud config set project $PROJECT_ID
echo ""

# Authenticate Docker
echo -e "${YELLOW}🔐 Authenticating Docker with GCR...${NC}"
gcloud auth configure-docker gcr.io
echo ""

# Build Docker image
echo -e "${YELLOW}🏗️  Building Docker image...${NC}"
docker build \
  -f jobs/video-processor/Dockerfile \
  -t gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  -t gcr.io/$PROJECT_ID/$SERVICE_NAME:$(date +%Y%m%d-%H%M%S) \
  .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker image built${NC}"
echo ""

# Push to GCR
echo -e "${YELLOW}📤 Pushing image to Google Container Registry...${NC}"
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker push failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Image pushed to GCR${NC}"
echo ""

# Check if WEBHOOK_SECRET exists
echo -e "${YELLOW}🔑 Checking webhook secret...${NC}"
if ! gcloud secrets describe WEBHOOK_SECRET --project=$PROJECT_ID &> /dev/null; then
    echo -e "${YELLOW}⚠️  WEBHOOK_SECRET not found, creating...${NC}"

    # Generate secret
    WEBHOOK_SECRET=$(openssl rand -hex 32)

    # Create secret
    echo -n "$WEBHOOK_SECRET" | \
      gcloud secrets create WEBHOOK_SECRET \
        --data-file=- \
        --replication-policy="automatic" \
        --project=$PROJECT_ID

    echo -e "${GREEN}✅ Created WEBHOOK_SECRET${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Save this secret!${NC}"
    echo "   WEBHOOK_SECRET=$WEBHOOK_SECRET"
    echo ""
else
    echo -e "${GREEN}✅ WEBHOOK_SECRET already exists${NC}"
fi
echo ""

# Deploy as Cloud Run Job
echo -e "${YELLOW}🚀 Deploying as Cloud Run Job...${NC}"

# Check if job exists
if gcloud run jobs describe $SERVICE_NAME \
    --region $REGION \
    --project $PROJECT_ID &> /dev/null; then
    echo -e "${YELLOW}📝 Updating existing Cloud Run Job...${NC}"

    gcloud run jobs update $SERVICE_NAME \
      --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
      --region $REGION \
      --project $PROJECT_ID \
      --memory 4Gi \
      --cpu 2 \
      --task-timeout 3600 \
      --max-retries 3 \
      --parallelism 1 \
      --tasks 1 \
      --set-env-vars NODE_ENV=production \
      --update-secrets DATABASE_URL=DATABASE_URL_DEV:latest \
      --update-secrets GCS_PROJECT_ID=GCS_PROJECT_ID:latest \
      --update-secrets GCS_CLIENT_EMAIL=GCS_CLIENT_EMAIL:latest \
      --update-secrets GCS_PRIVATE_KEY=GCS_PRIVATE_KEY:latest \
      --update-secrets GCS_BUCKET_NAME=GCS_BUCKET_NAME:latest
else
    echo -e "${YELLOW}🆕 Creating new Cloud Run Job...${NC}"

    gcloud run jobs create $SERVICE_NAME \
      --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
      --region $REGION \
      --project $PROJECT_ID \
      --memory 4Gi \
      --cpu 2 \
      --task-timeout 3600 \
      --max-retries 3 \
      --parallelism 1 \
      --tasks 1 \
      --set-env-vars NODE_ENV=production \
      --set-secrets DATABASE_URL=DATABASE_URL_DEV:latest \
      --set-secrets GCS_PROJECT_ID=GCS_PROJECT_ID:latest \
      --set-secrets GCS_CLIENT_EMAIL=GCS_CLIENT_EMAIL:latest \
      --set-secrets GCS_PRIVATE_KEY=GCS_PRIVATE_KEY:latest \
      --set-secrets GCS_BUCKET_NAME=GCS_BUCKET_NAME:latest
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Cloud Run Job deployment failed${NC}"
    exit 1
fi
echo ""

echo -e "${GREEN}✅ Cloud Run Job deployed successfully!${NC}"
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Successful! 🎉${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}📝 Job Details:${NC}"
echo ""
echo "   Job Name: $SERVICE_NAME"
echo "   Region: $REGION"
echo "   Memory: 4Gi"
echo "   CPU: 2"
echo "   Timeout: 3600s (1 hour)"
echo "   Max Retries: 3"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo ""
echo "1. Install Google Cloud Run SDK in main app:"
echo "   npm install @google-cloud/run"
echo ""
echo "2. Main app will trigger jobs via Cloud Run Jobs API"
echo "   (No URL needed - jobs don't expose HTTP endpoints)"
echo ""
echo "3. Monitor job executions:"
echo "   gcloud run jobs executions list --job=$SERVICE_NAME --region=$REGION"
echo ""
echo "4. View logs for a specific execution:"
echo "   gcloud run jobs executions logs read [EXECUTION_NAME] --job=$SERVICE_NAME --region=$REGION"
echo ""
echo "5. Test manual execution:"
echo "   gcloud run jobs execute $SERVICE_NAME \\"
echo "     --region $REGION \\"
echo "     --update-env-vars JOB_ID=test-id,SCENE_ID=test-scene-id"
echo ""
echo -e "${GREEN}========================================${NC}"
echo ""
