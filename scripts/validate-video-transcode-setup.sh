#!/bin/bash
# Validation script for GPU video transcoding setup
# Checks all prerequisites before deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
ERRORS=0
WARNINGS=0

# Load environment variables if .env exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Get project ID
if [ -z "$GCP_PROJECT_ID" ] && [ -z "$PROJECT_ID" ]; then
  PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")
else
  PROJECT_ID="${GCP_PROJECT_ID:-$PROJECT_ID}"
fi

echo "=========================================="
echo "Validating GPU Transcoding Setup..."
echo "=========================================="
echo ""

# Check 1: gcloud CLI installed
echo -n "Checking gcloud CLI... "
if command -v gcloud &> /dev/null; then
  VERSION=$(gcloud version --format="value(Google Cloud SDK)" 2>/dev/null | head -n1)
  echo -e "${GREEN}✅ Installed${NC} (version $VERSION)"
else
  echo -e "${RED}❌ NOT FOUND${NC}"
  echo "   Install: https://cloud.google.com/sdk/docs/install"
  ((ERRORS++))
fi

# Check 2: gcloud authenticated
echo -n "Checking authentication... "
ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | head -n1)
if [ -n "$ACTIVE_ACCOUNT" ]; then
  echo -e "${GREEN}✅ Authenticated${NC} as $ACTIVE_ACCOUNT"
else
  echo -e "${RED}❌ NOT AUTHENTICATED${NC}"
  echo "   Run: gcloud auth login"
  ((ERRORS++))
fi

# Check 3: Project accessible
echo -n "Checking project access... "
if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}❌ NO PROJECT SET${NC}"
  echo "   Run: gcloud config set project YOUR_PROJECT_ID"
  ((ERRORS++))
elif gcloud projects describe "$PROJECT_ID" &>/dev/null; then
  echo -e "${GREEN}✅ Project accessible${NC} ($PROJECT_ID)"
else
  echo -e "${RED}❌ CANNOT ACCESS PROJECT${NC} ($PROJECT_ID)"
  echo "   Verify project ID with: gcloud projects list"
  ((ERRORS++))
fi

# Exit early if basic checks failed
if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "=========================================="
  echo -e "${RED}❌ Basic setup incomplete${NC}"
  echo "   Fix the errors above before continuing"
  echo "=========================================="
  exit 1
fi

# Define resource names
PREPROCESSING_BUCKET="gs://preprocessing-${PROJECT_ID}"
TRANSCODED_BUCKET="gs://transcoded-${PROJECT_ID}"
SERVICE_ACCOUNT="video-encoding@${PROJECT_ID}.iam.gserviceaccount.com"
JOB_NAME="video-encoding-job"
REGION="us-central1"

# Check 4: Preprocessing bucket exists
echo -n "Checking preprocessing bucket... "
if gcloud storage buckets describe "$PREPROCESSING_BUCKET" &>/dev/null; then
  echo -e "${GREEN}✅ Exists${NC} ($PREPROCESSING_BUCKET)"
else
  echo -e "${RED}❌ NOT FOUND${NC}"
  echo "   Run: ./scripts/setup-video-transcode-buckets.sh"
  ((ERRORS++))
fi

# Check 5: Transcoded bucket exists
echo -n "Checking transcoded bucket... "
if gcloud storage buckets describe "$TRANSCODED_BUCKET" &>/dev/null; then
  echo -e "${GREEN}✅ Exists${NC} ($TRANSCODED_BUCKET)"
else
  echo -e "${RED}❌ NOT FOUND${NC}"
  echo "   Run: ./scripts/setup-video-transcode-buckets.sh"
  ((ERRORS++))
fi

# Check 6: Service account exists
echo -n "Checking service account... "
if gcloud iam service-accounts describe "$SERVICE_ACCOUNT" --project="$PROJECT_ID" &>/dev/null; then
  echo -e "${GREEN}✅ Exists${NC} ($SERVICE_ACCOUNT)"
else
  echo -e "${RED}❌ NOT FOUND${NC}"
  echo "   Run: ./scripts/setup-video-transcode-buckets.sh"
  ((ERRORS++))
fi

# Check 7: Preprocessing bucket permissions
echo -n "Checking preprocessing permissions... "
if gcloud storage buckets get-iam-policy "$PREPROCESSING_BUCKET" \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:$SERVICE_ACCOUNT" \
  --format="value(bindings.role)" 2>/dev/null | grep -q "storage.objectViewer\|storage.admin\|storage.objectAdmin"; then
  echo -e "${GREEN}✅ Permissions OK${NC}"
else
  echo -e "${RED}❌ MISSING PERMISSIONS${NC}"
  echo "   Run: ./scripts/setup-video-transcode-buckets.sh"
  ((ERRORS++))
fi

# Check 8: Transcoded bucket permissions
echo -n "Checking transcoded permissions... "
if gcloud storage buckets get-iam-policy "$TRANSCODED_BUCKET" \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:$SERVICE_ACCOUNT" \
  --format="value(bindings.role)" 2>/dev/null | grep -q "storage.objectAdmin\|storage.admin"; then
  echo -e "${GREEN}✅ Permissions OK${NC}"
else
  echo -e "${RED}❌ MISSING PERMISSIONS${NC}"
  echo "   Run: ./scripts/setup-video-transcode-buckets.sh"
  ((ERRORS++))
fi

# Check 9: Cloud Run Job deployed (warning only)
echo -n "Checking Cloud Run Job... "
if gcloud run jobs describe "$JOB_NAME" --region="$REGION" --project="$PROJECT_ID" &>/dev/null; then
  echo -e "${GREEN}✅ Deployed${NC} ($JOB_NAME)"
else
  echo -e "${YELLOW}⚠️  NOT DEPLOYED YET${NC}"
  echo "   This is OK if you haven't deployed yet"
  echo "   Deploy with: GitHub Actions or gcloud CLI"
  ((WARNINGS++))
fi

# Check 10: GPU quota (best effort, warning only)
echo -n "Checking GPU quota... "
# Note: This is a best-effort check, not always accurate
QUOTA_CHECK=$(gcloud compute project-info describe \
  --project="$PROJECT_ID" \
  --format="json" 2>/dev/null | grep -i "nvidia-l4" || echo "")

if [ -n "$QUOTA_CHECK" ]; then
  echo -e "${GREEN}✅ GPU resources configured${NC}"
else
  echo -e "${YELLOW}⚠️  CANNOT VERIFY GPU QUOTA${NC}"
  echo "   Check manually: https://console.cloud.google.com/iam-admin/quotas"
  echo "   Search for: 'Total Nvidia L4 GPU allocation'"
  ((WARNINGS++))
fi

echo ""
echo "=========================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ Perfect! All checks passed.${NC}"
  echo "   Your GPU transcoding setup is ready!"
elif [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ Setup is valid!${NC}"
  echo -e "   $WARNINGS ${YELLOW}warning(s)${NC} - review above"
  echo "   You can proceed with deployment."
else
  echo -e "${RED}❌ Setup incomplete${NC}"
  echo "   $ERRORS error(s) found - fix them before deployment"
  echo ""
  echo "Quick fix: Run the setup script"
  echo "   ./scripts/setup-video-transcode-buckets.sh"
fi

echo "=========================================="
echo ""

# Next steps
if [ $ERRORS -eq 0 ]; then
  echo "Next steps:"
  echo "  1. Deploy GPU job: See GPU_TRANSCODING_QUICKSTART.md"
  echo "  2. Test transcoding: Upload a video and run the job"
  echo ""
else
  echo "Fix errors then re-run validation:"
  echo "  ./scripts/validate-video-transcode-setup.sh"
  echo ""
fi

# Exit with appropriate code
if [ $ERRORS -gt 0 ]; then
  exit 1
else
  exit 0
fi
