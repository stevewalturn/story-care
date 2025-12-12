#!/bin/bash
# Backup dev database and restore to prod using gcloud sql export/import

set -e

echo "🔄 Database Migration: Dev → Prod (using gcloud)"
echo "=================================================="
echo ""

# Configuration
DEV_PROJECT="storycare-dev-479511"
DEV_INSTANCE="storycare-dev"
DEV_DB="storycare_dev"

PROD_PROJECT="storycare-478114"
PROD_INSTANCE="storycare-dev"
PROD_DB="storycare_dev"

# GCS bucket for temporary backup (must exist in one of the projects)
GCS_BUCKET="gs://storycare-dev-backup-temp"
BACKUP_FILE="storycare_dev_backup_$(date +%Y%m%d_%H%M%S).sql"
GCS_PATH="$GCS_BUCKET/$BACKUP_FILE"

echo "📊 Configuration:"
echo "  Dev:  $DEV_PROJECT:$DEV_INSTANCE/$DEV_DB"
echo "  Prod: $PROD_PROJECT:$PROD_INSTANCE/$PROD_DB"
echo "  Backup: $GCS_PATH"
echo ""

# Step 1: Create GCS bucket if it doesn't exist
echo "🪣 Checking GCS bucket..."
if ! gsutil ls "$GCS_BUCKET" &>/dev/null; then
  echo "  Creating bucket $GCS_BUCKET..."
  gsutil mb -p "$DEV_PROJECT" -l us-central1 "$GCS_BUCKET"
else
  echo "  ✅ Bucket exists"
fi

# Step 2: Export dev database to GCS
echo ""
echo "💾 Exporting DEV database to GCS..."
gcloud sql export sql "$DEV_INSTANCE" "$GCS_PATH" \
  --project="$DEV_PROJECT" \
  --database="$DEV_DB"

echo "  ✅ Export completed: $GCS_PATH"

# Step 3: Confirm before importing to prod
echo ""
echo "📥 Ready to import to PROD database..."
echo "⚠️  WARNING: This will overwrite data in prod!"
read -p "Type 'CONFIRM' to proceed: " CONFIRM

if [ "$CONFIRM" != "CONFIRM" ]; then
  echo "❌ Aborted by user"
  echo "  Backup file preserved at: $GCS_PATH"
  exit 1
fi

# Step 3.5: Drop and recreate prod database to avoid conflicts
echo ""
echo "🗑️  Dropping and recreating PROD database..."
gcloud sql databases delete "$PROD_DB" \
  --instance="$PROD_INSTANCE" \
  --project="$PROD_PROJECT" \
  --quiet

gcloud sql databases create "$PROD_DB" \
  --instance="$PROD_INSTANCE" \
  --project="$PROD_PROJECT"

echo "  ✅ Database recreated"

# Step 4: Import to prod database
echo ""
echo "📥 Importing to PROD database..."
gcloud sql import sql "$PROD_INSTANCE" "$GCS_PATH" \
  --project="$PROD_PROJECT" \
  --database="$PROD_DB" \
  --quiet

echo "  ✅ Import completed!"

# Step 5: Cleanup (optional)
echo ""
read -p "Delete backup file from GCS? (y/N): " DELETE_BACKUP

if [ "$DELETE_BACKUP" = "y" ] || [ "$DELETE_BACKUP" = "Y" ]; then
  gsutil rm "$GCS_PATH"
  echo "  🗑️  Backup deleted"
else
  echo "  📦 Backup preserved at: $GCS_PATH"
fi

echo ""
echo "🎉 Migration completed successfully!"
echo ""
echo "📋 Summary:"
echo "  Dev database: $DEV_PROJECT:$DEV_INSTANCE/$DEV_DB (unchanged)"
echo "  Prod database: $PROD_PROJECT:$PROD_INSTANCE/$PROD_DB (updated)"
