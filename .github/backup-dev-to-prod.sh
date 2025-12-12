#!/bin/bash
# Backup dev database and restore to prod

set -e

echo "🔄 Database Migration: Dev → Prod"
echo "=================================="
echo ""

# Configuration
DEV_PROJECT="storycare-dev-479511"
DEV_INSTANCE="storycare-dev"
DEV_DB="storycare_dev"
DEV_CONNECTION="$DEV_PROJECT:us-central1:$DEV_INSTANCE"

PROD_PROJECT="storycare-478114"
PROD_INSTANCE="storycare-dev"  # Assuming same instance name
PROD_DB="storycare_dev"
PROD_CONNECTION="$PROD_PROJECT:us-central1:$PROD_INSTANCE"

BACKUP_FILE="/tmp/storycare_dev_backup_$(date +%Y%m%d_%H%M%S).sql"

echo "📊 Configuration:"
echo "  Dev:  $DEV_CONNECTION/$DEV_DB"
echo "  Prod: $PROD_CONNECTION/$PROD_DB"
echo "  Backup file: $BACKUP_FILE"
echo ""

# Step 1: Start cloud-sql-proxy for dev (port 5434)
echo "🚀 Starting cloud-sql-proxy for DEV on port 5434..."
cloud-sql-proxy "$DEV_CONNECTION" --port 5434 &
DEV_PROXY_PID=$!
echo "  PID: $DEV_PROXY_PID"
sleep 5

# Step 2: Dump dev database
echo ""
echo "💾 Backing up DEV database..."
PGPASSWORD="${DEV_DB_PASSWORD:-}" pg_dump \
  -h localhost \
  -p 5434 \
  -U postgres \
  -d "$DEV_DB" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  -f "$BACKUP_FILE"

if [ -f "$BACKUP_FILE" ]; then
  BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "  ✅ Backup created: $BACKUP_FILE ($BACKUP_SIZE)"
else
  echo "  ❌ Backup failed!"
  kill $DEV_PROXY_PID
  exit 1
fi

# Step 3: Stop dev proxy
echo ""
echo "🛑 Stopping DEV proxy..."
kill $DEV_PROXY_PID
sleep 2

# Step 4: Start cloud-sql-proxy for prod (port 5435)
echo ""
echo "🚀 Starting cloud-sql-proxy for PROD on port 5435..."
cloud-sql-proxy "$PROD_CONNECTION" --port 5435 &
PROD_PROXY_PID=$!
echo "  PID: $PROD_PROXY_PID"
sleep 5

# Step 5: Restore to prod database
echo ""
echo "📥 Restoring to PROD database..."
echo "⚠️  WARNING: This will DROP existing tables in prod!"
read -p "Type 'CONFIRM' to proceed: " CONFIRM

if [ "$CONFIRM" != "CONFIRM" ]; then
  echo "❌ Aborted by user"
  kill $PROD_PROXY_PID
  exit 1
fi

PGPASSWORD="${PROD_DB_PASSWORD:-}" psql \
  -h localhost \
  -p 5435 \
  -U postgres \
  -d "$PROD_DB" \
  -f "$BACKUP_FILE"

echo "  ✅ Restore completed!"

# Step 6: Cleanup
echo ""
echo "🧹 Cleaning up..."
kill $PROD_PROXY_PID
echo "  ✅ Proxy stopped"

echo ""
echo "🎉 Migration completed successfully!"
echo ""
echo "📋 Summary:"
echo "  Backup file: $BACKUP_FILE (preserved for safety)"
echo "  Dev database: $DEV_CONNECTION/$DEV_DB (unchanged)"
echo "  Prod database: $PROD_CONNECTION/$PROD_DB (updated)"
echo ""
echo "To delete the backup file:"
echo "  rm $BACKUP_FILE"
