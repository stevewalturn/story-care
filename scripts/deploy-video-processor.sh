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

# Deploy to Cloud Run
echo -e "${YELLOW}🚀 Deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 4Gi \
  --cpu 2 \
  --timeout 900 \
  --max-instances 10 \
  --min-instances 0 \
  --port 8080 \
  --set-env-vars NODE_ENV=production \
  --update-secrets WEBHOOK_SECRET=WEBHOOK_SECRET:latest \
  --project $PROJECT_ID

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Cloud Run deployment failed${NC}"
    exit 1
fi
echo ""

# Get service URL
echo -e "${YELLOW}🔗 Getting service URL...${NC}"
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format 'value(status.url)' \
  --project $PROJECT_ID)

echo -e "${GREEN}✅ Service deployed successfully!${NC}"
echo ""

# Health check
echo -e "${YELLOW}🏥 Running health check...${NC}"
sleep 5

HEALTH_RESPONSE=$(curl -s $SERVICE_URL/health)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}⚠️  Health check failed${NC}"
    echo "   Response: $HEALTH_RESPONSE"
fi
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Successful! 🎉${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo ""
echo "1. Update main app environment:"
echo -e "   ${GREEN}export VIDEO_PROCESSOR_URL='$SERVICE_URL'${NC}"
echo ""
echo "2. Update Cloud Run main app:"
echo "   gcloud run services update storycare-app-dev \\"
echo "     --region $REGION \\"
echo "     --set-env-vars VIDEO_PROCESSOR_URL=$SERVICE_URL \\"
echo "     --update-secrets WEBHOOK_SECRET=WEBHOOK_SECRET:latest"
echo ""
echo "3. For local development, add to .env.local:"
echo "   VIDEO_PROCESSOR_URL=$SERVICE_URL"
echo "   WEBHOOK_SECRET=<get from Secret Manager>"
echo ""
echo "4. Test the service:"
echo "   curl $SERVICE_URL/health"
echo ""
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Service URL: $SERVICE_URL"
echo "Logs: gcloud run services logs tail $SERVICE_NAME --region $REGION"
echo ""
