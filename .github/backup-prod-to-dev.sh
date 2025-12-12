#!/bin/bash
# Backup PROD database and restore to DEV (correct direction!)

set -e

echo "🔄 Database Migration: PROD → DEV"
echo "=================================="
echo ""

# Configuration
PROD_PROJECT="storycare-478114"
PROD_INSTANCE="storycare-dev"
PROD_DB="storycare_dev"

DEV_PROJECT="storycare-dev-479511"
DEV_INSTANCE="storycare-dev"
DEV_DB="storycare_dev"

# GCS bucket for temporary backup
GCS_BUCKET="gs://storycare-dev-backup-temp"
BACKUP_FILE="storycare_prod_backup_$(date +%Y%m%d_%H%M%S).sql"
GCS_PATH="$GCS_BUCKET/$BACKUP_FILE"

echo "📊 Configuration:"
echo "  Prod: $PROD_PROJECT:$PROD_INSTANCE/$PROD_DB"
echo "  Dev:  $DEV_PROJECT:$DEV_INSTANCE/$DEV_DB"
echo "  Backup: $GCS_PATH"
echo ""

# Step 1: Check GCS bucket
echo "🪣 Checking GCS bucket..."
if ! gsutil ls "$GCS_BUCKET" &>/dev/null; then
  echo "  Creating bucket $GCS_BUCKET..."
  gsutil mb -p "$PROD_PROJECT" -l us-central1 "$GCS_BUCKET"
else
  echo "  ✅ Bucket exists"
fi

# Step 2: Export PROD database to GCS
echo ""
echo "💾 Exporting PROD database to GCS..."
gcloud sql export sql "$PROD_INSTANCE" "$GCS_PATH" \
  --project="$PROD_PROJECT" \
  --database="$PROD_DB"

echo "  ✅ Export completed: $GCS_PATH"

# Step 3: Confirm before importing to dev
echo ""
echo "📥 Ready to import to DEV database..."
echo "⚠️  WARNING: This will overwrite data in DEV!"
read -p "Type 'CONFIRM' to proceed: " CONFIRM

if [ "$CONFIRM" != "CONFIRM" ]; then
  echo "❌ Aborted by user"
  echo "  Backup file preserved at: $GCS_PATH"
  exit 1
fi

# Step 4: Drop and recreate DEV database to avoid conflicts
echo ""
echo "🗑️  Dropping and recreating DEV database..."
gcloud sql databases delete "$DEV_DB" \
  --instance="$DEV_INSTANCE" \
  --project="$DEV_PROJECT" \
  --quiet

gcloud sql databases create "$DEV_DB" \
  --instance="$DEV_INSTANCE" \
  --project="$DEV_PROJECT"

echo "  ✅ Database recreated"

# Step 5: Import to DEV database
echo ""
echo "📥 Importing to DEV database..."
gcloud sql import sql "$DEV_INSTANCE" "$GCS_PATH" \
  --project="$DEV_PROJECT" \
  --database="$DEV_DB" \
  --quiet

echo "  ✅ Import completed!"

# Step 6: Cleanup (optional)
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
echo "  Prod database: $PROD_PROJECT:$PROD_INSTANCE/$PROD_DB (unchanged)"
echo "  Dev database: $DEV_PROJECT:$DEV_INSTANCE/$DEV_DB (updated with PROD data)"
