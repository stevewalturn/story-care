#!/bin/bash

PROJECT_ID="storycare-478114"

echo "Initializing GCR for project ${PROJECT_ID}..."
echo ""

echo "Step 1: Configure Docker to use gcloud credentials..."
gcloud auth configure-docker

echo ""
echo "Step 2: Pull a test image..."
docker pull hello-world

echo ""
echo "Step 3: Tag and push to GCR (this creates the bucket)..."
docker tag hello-world gcr.io/${PROJECT_ID}/init:latest
docker push gcr.io/${PROJECT_ID}/init:latest

echo ""
echo "✅ Done! GCR bucket is now created."
echo "GitHub Actions can now push to gcr.io/${PROJECT_ID}/"
echo ""
echo "You can delete the test image:"
echo "  gcloud container images delete gcr.io/${PROJECT_ID}/init:latest --quiet"
