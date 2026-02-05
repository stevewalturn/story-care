# Google Cloud Storage - Quick Command Setup

This guide provides the exact commands to set up Google Cloud Storage for StoryCare with a new service account.

## Prerequisites

1. Install Google Cloud CLI: https://cloud.google.com/sdk/docs/install
2. Authenticate: `gcloud auth login`

## Step 1: Set Project Variables

```bash
export PROJECT_ID="storycare-478114"
export BUCKET_NAME="storycare-dev-media"
export SERVICE_ACCOUNT_NAME="storycare-gcs-service"
export SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
export KEY_FILE="storycare-gcs-key.json"
```

## Step 2: Set Active Project

```bash
gcloud config set project $PROJECT_ID
```

## Step 3: Enable Required APIs

```bash
# Enable Cloud Storage API
gcloud services enable storage-api.googleapis.com

# Enable IAM API (if not already enabled)
gcloud services enable iam.googleapis.com
```

## Step 4: Create Storage Bucket (if not exists)

```bash
# Check if bucket exists first
gsutil ls gs://$BUCKET_NAME 2>/dev/null || {
    echo "Creating bucket: $BUCKET_NAME"
    # Create bucket in us-central1 region
    gsutil mb -p $PROJECT_ID -c STANDARD -l us-central1 gs://$BUCKET_NAME
    
    # Enable uniform bucket-level access (recommended for security)
    gsutil uniformbucketlevelaccess set on gs://$BUCKET_NAME
    
    echo "Bucket created successfully"
}
```

## Step 5: Create Service Account

```bash
# Create service account
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
    --display-name="StoryCare GCS Service Account" \
    --description="Service account for StoryCare Google Cloud Storage operations"
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/storage.admin"
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/storage.objectAdmin"
```

## Step 6: Create and Download Service Account Key

```bash
# Create and download service account key
gcloud iam service-accounts keys create $KEY_FILE \
    --iam-account=$SERVICE_ACCOUNT_EMAIL

echo ""
echo "=== Service Account Key Created ==="
echo "Key file saved as: $KEY_FILE"
echo ""
echo "=== Environment Variables for .env.local ==="
echo "# Add these to your .env.local file:"
echo ""
echo "# Google Cloud Storage"
echo "GCS_PROJECT_ID=\"$PROJECT_ID\""
echo "GCS_BUCKET_NAME=\"$BUCKET_NAME\""
echo "GCS_CLIENT_EMAIL=\"$SERVICE_ACCOUNT_EMAIL\""
echo "GCS_PRIVATE_KEY=\"$(cat $KEY_FILE | jq -r .private_key)\""
echo ""
echo "=== Complete Key File Content ==="
echo "For reference, here's the complete key file:"
cat $KEY_FILE
```

## Step 7: Test the Setup

```bash
# Create test file
echo "test upload from $(date)" > test-file.txt

# Upload test file
gsutil cp test-file.txt gs://$BUCKET_NAME/test/

# List files in bucket
echo ""
echo "=== Files in bucket ==="
gsutil ls gs://$BUCKET_NAME/

# Test if file exists
if gsutil ls gs://$BUCKET_NAME/test/test-file.txt > /dev/null 2>&1; then
    echo "✅ Upload test successful!"
else
    echo "❌ Upload test failed!"
fi

# Clean up test file
gsutil rm gs://$BUCKET_NAME/test/test-file.txt
rm test-file.txt

echo "✅ GCS setup complete!"
```

## Step 8: Set CORS Policy (Optional)

Create CORS configuration for browser uploads:

```bash
# Create cors.json file
cat > cors.json << 'EOF'
[
  {
    "origin": ["http://localhost:3000", "http://localhost:3001", "https://your-domain.com"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "responseHeader": ["Content-Type", "x-goog-resumable"],
    "maxAgeSeconds": 3600
  }
]
EOF

# Apply CORS policy
gsutil cors set cors.json gs://$BUCKET_NAME

# Verify CORS
gsutil cors get gs://$BUCKET_NAME
```

## Complete Setup Script

Here's a complete script that runs all the above commands:

```bash
#!/bin/bash
# GCS Setup Script for StoryCare

set -e  # Exit on error

# Project variables
PROJECT_ID="storycare-dev-479511"
BUCKET_NAME="storycare-dev-media"
SERVICE_ACCOUNT_NAME="storycare-gcs-service"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
KEY_FILE="storycare-gcs-key.json"

echo "🚀 Setting up Google Cloud Storage for StoryCare..."

# Set project
echo "📋 Setting project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Enable APIs
echo "🔧 Enabling required APIs..."
gcloud services enable storage-api.googleapis.com
gcloud services enable iam.googleapis.com

# Create bucket if not exists
echo "🪣 Checking/Creating bucket: $BUCKET_NAME"
gsutil ls gs://$BUCKET_NAME 2>/dev/null || {
    echo "Creating bucket: $BUCKET_NAME"
    gsutil mb -p $PROJECT_ID -c STANDARD -l us-central1 gs://$BUCKET_NAME
    gsutil uniformbucketlevelaccess set on gs://$BUCKET_NAME
    echo "Bucket created successfully"
}

# Create service account
echo "👤 Creating service account: $SERVICE_ACCOUNT_NAME"
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
    --display-name="StoryCare GCS Service Account" \
    --description="Service account for StoryCare Google Cloud Storage operations" 2>/dev/null || {
    echo "Service account already exists, continuing..."
}

# Grant permissions
echo "🔐 Granting permissions..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/storage.admin" --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/storage.objectAdmin" --quiet

# Create service account key
echo "🔑 Creating service account key..."
gcloud iam service-accounts keys create $KEY_FILE \
    --iam-account=$SERVICE_ACCOUNT_EMAIL

# Test upload
echo "🧪 Testing upload..."
echo "test upload from $(date)" > test-file.txt
gsutil cp test-file.txt gs://$BUCKET_NAME/test/
gsutil rm gs://$BUCKET_NAME/test/test-file.txt
rm test-file.txt

echo ""
echo "✅ GCS Setup Complete!"
echo ""
echo "=== Next Steps ==="
echo "1. Add these environment variables to your .env.local file:"
echo ""
echo "# Google Cloud Storage"
echo "GCS_PROJECT_ID=\"$PROJECT_ID\""
echo "GCS_BUCKET_NAME=\"$BUCKET_NAME\""
echo "GCS_CLIENT_EMAIL=\"$SERVICE_ACCOUNT_EMAIL\""
echo "GCS_PRIVATE_KEY=\"$(cat $KEY_FILE | jq -r .private_key)\""
echo ""
echo "2. Restart your development server"
echo "3. The key file is saved as: $KEY_FILE"
echo ""
echo "🔒 Security Note: Keep the $KEY_FILE file secure and never commit it to git!"
```

Save this as `setup-gcs.sh` and run:

```bash
chmod +x setup-gcs.sh
./setup-gcs.sh
```

## Environment Variables to Add

After running the setup, add these to your `.env.local` file:

```bash
# Google Cloud Storage
GCS_PROJECT_ID="storycare-dev-479511"
GCS_BUCKET_NAME="storycare-dev-media"
GCS_CLIENT_EMAIL="storycare-gcs-service@storycare-dev-479511.iam.gserviceaccount.com"
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_FROM_JSON_FILE\n-----END PRIVATE KEY-----\n"
```

## Cleanup (if needed)

To remove the setup:

```bash
# Delete service account key (get key ID first)
gcloud iam service-accounts keys list --iam-account=$SERVICE_ACCOUNT_EMAIL
gcloud iam service-accounts keys delete KEY_ID --iam-account=$SERVICE_ACCOUNT_EMAIL

# Delete service account
gcloud iam service-accounts delete $SERVICE_ACCOUNT_EMAIL

# Delete bucket (WARNING: This deletes all files)
gsutil rm -r gs://$BUCKET_NAME
```

---

**Project**: StoryCare Digital Therapeutic Platform  
**Updated**: 2024-11-28
