#!/bin/bash
# Setup script for GPU video transcoding Cloud Storage buckets
# Creates input and output buckets with proper permissions

set -e

# Parse arguments
DRY_RUN=false
if [ "$1" = "--dry-run" ]; then
  DRY_RUN=true
fi

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Check if PROJECT_ID is set
if [ -z "$GCP_PROJECT_ID" ] && [ -z "$PROJECT_ID" ]; then
  echo "❌ ERROR: GCP_PROJECT_ID or PROJECT_ID must be set"
  echo "Please set it in your .env file or export it"
  echo ""
  echo "Example:"
  echo "  export GCP_PROJECT_ID=\"your-project-id\""
  echo "  ./scripts/setup-video-transcode-buckets.sh"
  exit 1
fi

PROJECT_ID="${GCP_PROJECT_ID:-$PROJECT_ID}"
REGION="${REGION:-us-central1}"
SERVICE_ACCOUNT="video-encoding@${PROJECT_ID}.iam.gserviceaccount.com"

# Dry run banner
if [ "$DRY_RUN" = true ]; then
  echo "=========================================="
  echo "🔍 DRY RUN MODE"
  echo "=========================================="
  echo "No changes will be made to your project."
  echo "This shows what WOULD be created."
  echo "=========================================="
  echo ""
fi

echo "=========================================="
echo "Video Transcoding GCS Setup"
echo "=========================================="
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "=========================================="
echo ""

# Pre-flight validation
echo "Running pre-flight checks..."
echo ""

# Check 1: gcloud CLI installed
echo -n "Checking gcloud CLI... "
if ! command -v gcloud &> /dev/null; then
  echo "❌ NOT FOUND"
  echo ""
  echo "Please install Google Cloud SDK:"
  echo "https://cloud.google.com/sdk/docs/install"
  exit 1
fi
echo "✅ Installed"

# Check 2: Authentication
echo -n "Checking authentication... "
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
  echo "❌ NOT AUTHENTICATED"
  echo ""
  echo "Please authenticate with:"
  echo "  gcloud auth login"
  exit 1
fi
ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | head -n1)
echo "✅ Authenticated as $ACTIVE_ACCOUNT"

# Check 3: Project accessibility
echo -n "Checking project access... "
if ! gcloud projects describe "$PROJECT_ID" &> /dev/null; then
  echo "❌ CANNOT ACCESS PROJECT"
  echo ""
  echo "Project '$PROJECT_ID' not found or not accessible."
  echo "Check your project ID with:"
  echo "  gcloud projects list"
  exit 1
fi
echo "✅ Project accessible"

echo ""
echo "=========================================="

# Create service account if it doesn't exist
echo "Creating service account..."
if gcloud iam service-accounts describe "$SERVICE_ACCOUNT" --project="$PROJECT_ID" &>/dev/null; then
  echo "ℹ️  Service account already exists: $SERVICE_ACCOUNT"
else
  if [ "$DRY_RUN" = true ]; then
    echo "Would create: $SERVICE_ACCOUNT"
  else
    gcloud iam service-accounts create video-encoding \
      --project="$PROJECT_ID" \
      --display-name="Video Encoding Service Account" \
      --description="Service account for GPU-accelerated video transcoding jobs"
    echo "✅ Service account created: $SERVICE_ACCOUNT"
  fi
fi

# Create preprocessing bucket
PREPROCESSING_BUCKET="gs://preprocessing-${PROJECT_ID}"
echo ""
echo "Creating preprocessing bucket..."

if gsutil ls "$PREPROCESSING_BUCKET" &>/dev/null; then
  echo "ℹ️  Bucket already exists: $PREPROCESSING_BUCKET"
else
  if [ "$DRY_RUN" = true ]; then
    echo "Would create: $PREPROCESSING_BUCKET"
    echo "  Location: $REGION"
    echo "  Access: Uniform bucket-level access"
  else
    gcloud storage buckets create "$PREPROCESSING_BUCKET" \
      --project="$PROJECT_ID" \
      --location="$REGION" \
      --uniform-bucket-level-access
    echo "✅ Bucket created: $PREPROCESSING_BUCKET"
  fi
fi

# Grant read access to service account
echo "Granting read access to service account..."
# Check if permission already exists
if gcloud storage buckets get-iam-policy "$PREPROCESSING_BUCKET" \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:$SERVICE_ACCOUNT AND bindings.role:roles/storage.objectViewer" \
  --format="value(bindings.role)" 2>/dev/null | grep -q "storage.objectViewer"; then
  echo "ℹ️  Permission already granted"
else
  if [ "$DRY_RUN" = true ]; then
    echo "Would grant: roles/storage.objectViewer to $SERVICE_ACCOUNT"
  else
    gcloud storage buckets add-iam-policy-binding "$PREPROCESSING_BUCKET" \
      --member="serviceAccount:${SERVICE_ACCOUNT}" \
      --role="roles/storage.objectViewer"
    echo "✅ Permission granted: roles/storage.objectViewer"
  fi
fi

# Create transcoded bucket
TRANSCODED_BUCKET="gs://transcoded-${PROJECT_ID}"
echo ""
echo "Creating transcoded bucket..."

if gsutil ls "$TRANSCODED_BUCKET" &>/dev/null; then
  echo "ℹ️  Bucket already exists: $TRANSCODED_BUCKET"
else
  if [ "$DRY_RUN" = true ]; then
    echo "Would create: $TRANSCODED_BUCKET"
    echo "  Location: $REGION"
    echo "  Access: Uniform bucket-level access"
  else
    gcloud storage buckets create "$TRANSCODED_BUCKET" \
      --project="$PROJECT_ID" \
      --location="$REGION" \
      --uniform-bucket-level-access
    echo "✅ Bucket created: $TRANSCODED_BUCKET"
  fi
fi

# Grant read/write access to service account
echo "Granting read/write access to service account..."
# Check if permission already exists
if gcloud storage buckets get-iam-policy "$TRANSCODED_BUCKET" \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:$SERVICE_ACCOUNT AND bindings.role:roles/storage.objectAdmin" \
  --format="value(bindings.role)" 2>/dev/null | grep -q "storage.objectAdmin"; then
  echo "ℹ️  Permission already granted"
else
  if [ "$DRY_RUN" = true ]; then
    echo "Would grant: roles/storage.objectAdmin to $SERVICE_ACCOUNT"
  else
    gcloud storage buckets add-iam-policy-binding "$TRANSCODED_BUCKET" \
      --member="serviceAccount:${SERVICE_ACCOUNT}" \
      --role="roles/storage.objectAdmin"
    echo "✅ Permission granted: roles/storage.objectAdmin"
  fi
fi

echo ""
echo "=========================================="
if [ "$DRY_RUN" = true ]; then
  echo "🔍 Dry Run Complete!"
  echo "=========================================="
  echo ""
  echo "The above shows what would be created."
  echo "To actually create resources, run without --dry-run:"
  echo "  ./scripts/setup-video-transcode-buckets.sh"
else
  echo "✅ Setup Complete!"
  echo "=========================================="
  echo ""
  echo "📦 Buckets created:"
  echo "  Input:  $PREPROCESSING_BUCKET"
  echo "  Output: $TRANSCODED_BUCKET"
  echo ""
  echo "👤 Service account: $SERVICE_ACCOUNT"
  echo ""
  echo "📋 Next steps:"
  echo "  1. Validate setup (recommended):"
  echo "     ./scripts/validate-video-transcode-setup.sh"
  echo ""
  echo "  2. Deploy GPU job:"
  echo "     See GPU_TRANSCODING_QUICKSTART.md"
  echo ""
  echo "  3. Test transcoding:"
  echo "     # Upload a video"
  echo "     gcloud storage cp your-video.mp4 ${PREPROCESSING_BUCKET}/"
  echo ""
  echo "     # Transcode with GPU"
  echo "     gcloud run jobs execute video-encoding-job \\"
  echo "       --region $REGION \\"
  echo "       --args=\"your-video.mp4,transcoded.mp4,-vcodec,h264_nvenc,-cq,21,-movflags,+faststart\""
  echo ""
  echo "     # Download result"
  echo "     gcloud storage cp ${TRANSCODED_BUCKET}/transcoded.mp4 ./"
fi
echo ""
echo "=========================================="
