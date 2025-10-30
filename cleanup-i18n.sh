#!/bin/bash

echo "🧹 StoryCare: Cleaning up i18n and Clerk files..."
echo ""

# Backup first
echo "📦 Creating backup..."
timestamp=$(date +%Y%m%d_%H%M%S)
mkdir -p .backups
tar -czf ".backups/pre-cleanup-$timestamp.tar.gz" src/app/[locale] src/libs/I18n*.ts src/locales 2>/dev/null || true

# Remove i18n lib files
echo "🗑️  Removing i18n configuration files..."
rm -f src/libs/I18n.ts
rm -f src/libs/I18nNavigation.ts
rm -f src/libs/I18nRouting.ts

# Remove locales directory
echo "🗑️  Removing locales directory..."
rm -rf src/locales

# Remove types
echo "🗑️  Removing i18n types..."
rm -f src/types/I18n.ts

# Keep [locale] directory for now (manual migration needed)
echo "⚠️  Keeping src/app/[locale] for manual migration"
echo "   You need to copy routes to root and remove i18n code manually"

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm run dev:simple"
echo "2. Follow MIGRATION_GUIDE.md to move routes from [locale] to root"
echo "3. Delete src/app/[locale] once migration is complete"
echo ""
