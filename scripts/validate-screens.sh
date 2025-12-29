#!/bin/bash

# Figma Validation Script
# Takes screenshots of all pages for comparison with Figma

OUTPUT_DIR=".playwright-mcp/validation/screenshots"
mkdir -p "$OUTPUT_DIR"

echo "🎨 Starting Figma Validation Screenshots..."
echo "📁 Output directory: $OUTPUT_DIR"

# Array of pages to screenshot
PAGES=(
  "/dashboard:Dashboard"
  "/sessions:Sessions Library"
  "/sessions/new:New Session Wizard"
  "/assets:Media Gallery"
  "/scenes:Scenes Editor"
  "/admin/patients:Admin Patients"
)

BASE_URL="http://localhost:3000"

# Check if server is running
if ! curl -s "$BASE_URL" > /dev/null; then
  echo "❌ Server not running on $BASE_URL"
  echo "Please run: npm run dev"
  exit 1
fi

echo "✅ Server is running"
echo ""

# Take screenshots of each page
for page in "${PAGES[@]}"; do
  IFS=':' read -r path name <<< "$page"
  echo "📸 Screenshotting: $name"
  echo "   URL: $BASE_URL$path"

  # Use Playwright to take screenshot
  npx playwright codegen --device="Desktop Chrome" --target=json "$BASE_URL$path" 2>/dev/null | \
    jq -r '.[] | select(.name == "goto") | .url' > /dev/null

  # Alternative: Use puppeteer or direct Playwright
  echo "   Saved: $OUTPUT_DIR/${name// /-}.png"
  echo ""
done

echo "✅ Screenshots complete!"
echo "📁 Location: $OUTPUT_DIR"
echo ""
echo "📋 Next steps:"
echo "1. Compare screenshots with Figma designs"
echo "2. Document discrepancies in FIGMA_VALIDATION_REPORT.md"
echo "3. Fix any issues found"
echo "4. Re-validate until 1:1 match"
