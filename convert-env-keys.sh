#!/bin/bash

# This script converts multi-line PEM keys to single-line format with \n

echo "Converting Firebase Admin Private Key..."
FIREBASE_KEY=$(sed -n '11,38p' .env.github.dev | awk '{printf "%s\\n", $0}' | sed 's/\\n$//')
echo "$FIREBASE_KEY"
echo ""

echo "Converting GCS Private Key..."
GCS_KEY=$(sed -n '41,68p' .env.github.dev | awk '{printf "%s\\n", $0}' | sed 's/\\n$//')
echo "$GCS_KEY"
echo ""

echo "==========================================="
echo "Copy these into your GitHub secret ENV_FILE_DEV:"
echo "==========================================="
echo ""
echo "$FIREBASE_KEY"
echo "$GCS_KEY"
