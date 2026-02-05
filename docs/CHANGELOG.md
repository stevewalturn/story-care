# Changelog

## [2025-11-19] - Module & Template System Overhaul

### 🎯 What's New

**Multi-Template Modules**
- Modules can now have multiple reflection and survey templates (not just one)
- Select multiple templates when creating or editing modules
- Better flexibility for therapeutic workflows

**Template Library**
- New "Templates Library" in navigation menu
- Browse, view, and copy reflection/survey templates
- Available for all user roles (Therapist, Org Admin, Super Admin)

**Prompt Library Enhancements**
- Integrated prompts into module editor
- Added `outputType` field (text, JSON, markdown)
- Track prompt usage across therapists
- Create and manage AI prompts for each role

### 🗑️ Removed

**Survey Bundle**
- Removed Survey Bundle UI and related fields
- Simplified template system (no more emotional impact/resonance metrics)

### 🔧 Technical Changes

**Database**
- Changed: `reflectionTemplateId` → `reflectionTemplateIds[]` (array)
- Changed: `surveyTemplateId` → `surveyTemplateIds[]` (array)
- Removed: Survey Bundle fields and single-template flags
- Migration: `0007_remove_survey_bundle_multi_select_templates.sql`

**New Components**
- `ViewTemplateDetailsModal` - Preview template questions
- `CopyTemplateModal` - Clone templates to your organization
- Enhanced `TemplateSelector` with multi-select

**API Updates**
- New: `/api/therapist/templates/[id]` - Fetch template by ID
- Updated: All module routes now handle template arrays
- Fixed: Firebase UID issues in prompt APIs

### 📦 Files Changed

**35 commits** | **36 files** | **+640 lines** | **-807 lines**

### 🚀 Migration

If upgrading:

```bash
# 1. Clean old data
npm run cleanup-modules

# 2. Run migration
npm run db:migrate

# 3. Re-seed modules
npm run db:seed-modules
```

### 📚 New Docs

- `MODULES_SYSTEM.md` - Module architecture guide
- `PROMPT_LIBRARY.md` - Prompt management guide
- `SCENES_IMPLEMENTATION_SUMMARY.md` - Video scenes overview

---

**Bottom Line**: Modules are now more flexible with multi-template support. Template and Prompt libraries make it easier to manage therapeutic content across the platform.
