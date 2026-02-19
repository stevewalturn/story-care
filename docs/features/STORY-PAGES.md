# Story Pages

## Overview

Story Pages are the core patient-facing content delivery system in StoryCare. Therapists build interactive, multimedia story pages that combine video, images, audio, text, quotes, notes, scenes, reflections, and surveys into a cohesive narrative experience for patients. Pages go through a draft/publish lifecycle and can be shared via time-limited links.

> **Callout:** Story pages can be auto-generated from treatment module analysis via `StoryPageGeneratorService`, or manually assembled by therapists in the page editor.

## User Roles

| Role | Access Level |
|---|---|
| **Super Admin** | View all pages across the platform |
| **Org Admin** | View all pages within their organization |
| **Therapist** | Create, edit, publish, delete, and share pages for their patients |
| **Patient** | View published pages assigned to them; submit reflection and survey responses |

## User Workflow

1. **Create Page** -- Therapist selects a patient and provides a title.
2. **Add Blocks** -- Therapist adds content blocks (video, image, audio, text, quote, note, scene, reflection, survey) in a desired sequence.
3. **Preview** -- Therapist reviews the page before publishing.
4. **Publish** -- Therapist changes the page status from `draft` to `published`. A `publishedAt` timestamp is recorded.
5. **Share (optional)** -- Therapist generates a time-limited share link (1 minute to 7 days). The link uses a cryptographic token and tracks access count.
6. **Patient Views** -- Patient accesses the page in the patient portal (`/patient/story/[id]`) or via a share link (`/share/[token]`).
7. **Patient Responds** -- Patient answers reflection questions (open text) and survey questions (multiple choice, scale, emotion).
8. **Review Responses** -- Therapist reviews patient responses on the dashboard or responses page.

## UI Pages

| Page | Path | Description |
|---|---|---|
| Pages List | `/(auth)/pages` | Lists all story pages for the therapist |
| New Page | `/(auth)/pages/new` | Create a new story page |
| View Page | `/(auth)/pages/[id]` | View a story page with all blocks |
| Edit Page | `/(auth)/pages/[id]/edit` | Edit page content and blocks |
| Patient Story List | `/(auth)/patient/story` | Patient view of their published pages |
| Patient Story View | `/(auth)/patient/story/[id]` | Patient view of a single story page |
| Shared Page | `/share/[token]` | Public access via share link (no auth required) |

## API Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/api/pages` | List story pages (filtered by role, patient, therapist) | Bearer token |
| POST | `/api/pages` | Create a new story page with optional blocks | Bearer token |
| GET | `/api/pages/[id]` | Get page with all blocks and presigned media URLs | Optional |
| PUT | `/api/pages/[id]` | Update page title, status, blocks, patientId | Bearer token |
| DELETE | `/api/pages/[id]` | Delete page and all associated blocks/responses | Bearer token |
| POST | `/api/pages/[id]/share` | Generate a time-limited share link | Bearer token |
| GET | `/api/pages/[id]/share` | List all active share links for a page | Bearer token |
| DELETE | `/api/pages/[id]/share` | Revoke all share links for a page | Bearer token |
| DELETE | `/api/pages/[id]/share/[linkId]` | Revoke a specific share link | Bearer token |
| POST | `/api/pages/[id]/responses` | Submit patient reflection and survey responses | Bearer token |
| GET | `/api/share/[token]` | Access a shared page (no auth, token-based) | None |
| POST | `/api/share/[token]/submit` | Submit responses via share link | None |
| POST | `/api/modules/[id]/generate-story-page` | Auto-generate story page from module analysis | Bearer token |

## Database Tables

| Table | Role in Feature |
|---|---|
| `story_pages` | Core page records with title, patient, therapist, status (draft/published/archived), visibility, share settings, module link |
| `page_blocks` | Individual content blocks within a page; ordered by `sequence_number`; references `media_library` and `scenes` |
| `page_share_links` | Time-limited shareable links with tokens, expiry, access tracking, revocation |
| `reflection_questions` | Open-text questions attached to reflection blocks |
| `survey_questions` | Multiple choice, scale, and emotion questions attached to survey blocks |
| `reflection_responses` | Patient text responses to reflection questions |
| `survey_responses` | Patient responses to survey questions (text or numeric) |
| `patient_page_interactions` | View count, first/last viewed timestamps, completion tracking |
| `email_notifications` | Notification records sent when pages are published |

## Key Files

| File | Purpose |
|---|---|
| `src/app/api/pages/route.ts` | List and create story pages |
| `src/app/api/pages/[id]/route.ts` | Get, update, delete a single page |
| `src/app/api/pages/[id]/share/route.ts` | Generate, list, and revoke share links |
| `src/app/api/pages/[id]/responses/route.ts` | Submit patient responses (reflection + survey) |
| `src/app/api/share/[token]/route.ts` | Public access to shared pages |
| `src/services/StoryPageGeneratorService.ts` | Auto-generate story pages from module analysis results |
| `src/app/(auth)/pages/page.tsx` | Pages list UI |
| `src/app/(auth)/pages/[id]/edit/page.tsx` | Page editor UI |
| `src/app/(auth)/patient/story/[id]/page.tsx` | Patient story view UI |
| `src/app/share/[token]/page.tsx` | Public share page UI |
| `src/models/Schema.ts` | Database schema: `storyPagesSchema`, `pageBlocksSchema`, `pageShareLinksSchema` |

## Technical Notes

- **Block Types**: The `block_type` enum supports: `video`, `image`, `audio`, `text`, `quote`, `note`, `scene`, `reflection`, `survey`.
- **Page Status**: Pages follow a `draft` -> `published` -> `archived` lifecycle. Only published pages are visible to patients.
- **Share Links**: Generated with `crypto.randomBytes(32)` for 64-character hex tokens. Expiry ranges from 1 to 10,080 minutes (7 days). Links track access count and last access time.
- **GCS Integration**: Media URLs in blocks are stored as raw GCS paths. Presigned URLs (1-hour expiry) are generated at read time for secure access.
- **Auto-Generation**: `StoryPageGeneratorService.generateStoryPageFromModule()` creates pages from AI analysis results, including intro text blocks, media blocks (up to 5 most recent), quote blocks, and clinical insight blocks.
- **Cascade Deletion**: Deleting a page cascades through: responses -> questions -> blocks -> interactions -> page, respecting foreign key constraints.
- **HIPAA Compliance**: Share links provide time-limited access without authentication. Authenticated access uses role-based filtering (patients see only their published pages).
