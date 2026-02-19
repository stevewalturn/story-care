# Treatment Modules

## Overview

Treatment modules are structured therapeutic frameworks that guide AI-powered session analysis. Each module belongs to one of four therapeutic domains and includes an AI prompt that produces structured analysis output. Modules can be linked to therapy sessions, triggering AI analysis and optional auto-generation of story pages from the results.

> **Callout:** Modules follow a three-tier scope model: system-level templates (managed by super admins), organization modules (managed by org admins), and private modules (created by individual therapists).

## User Roles

| Role | Access Level |
|---|---|
| **Super Admin** | Create, edit, and manage system-scope module templates; approve/reject templates |
| **Org Admin** | Create, edit, and manage organization-scope modules; copy system templates to org; approve pending modules |
| **Therapist** | Create private modules; view system + org + private modules; assign modules to sessions; submit modules for org approval |
| **Patient** | No direct access (benefits indirectly through generated story pages) |

## Therapeutic Domains

| Domain | Enum Value | Description |
|---|---|---|
| Self & Strength | `self_strength` | Exploring personal resilience and inner resources |
| Relationships & Repair | `relationships_repair` | Healing and building interpersonal connections |
| Identity & Transformation | `identity_transformation` | Reframing personal narratives and identity |
| Purpose & Future | `purpose_future` | Discovering meaning and envisioning the future |

## User Workflow

1. **Create Module** -- Therapist/admin creates a module with name, domain, description, and AI prompt text.
2. **Link AI Prompts** -- Modules can be linked to specific AI prompts via a junction table (`module_prompt_links`).
3. **Assign to Session** -- Therapist assigns a module to a therapy session, creating a `session_modules` record.
4. **AI Analysis** -- The session transcript is analyzed using the module's AI prompt, producing structured results stored in `ai_analysis_result` (JSONB).
5. **Review Results** -- Therapist reviews the analysis output (thematic summary, patient quotes, clinical insights).
6. **Generate Story Page** -- Optionally auto-generate a story page from the analysis via `StoryPageGeneratorService`.
7. **Approval Workflow** -- Private modules can be submitted for organization-level approval.

## Module Status Lifecycle

| Status | Description |
|---|---|
| `active` | Available for use |
| `archived` | Soft-deleted, no longer available |
| `pending_approval` | Submitted for organization approval |

## UI Pages

| Page | Path | Description |
|---|---|---|
| Therapist Modules | `/(auth)/therapist/modules` | List and manage private modules |
| Org Admin Modules | `/(auth)/org-admin/modules` | List and manage organization modules |
| Admin Modules | `/(auth)/admin/modules` | Admin module management |
| Super Admin Module Templates | `/(auth)/super-admin/module-templates` | System-scope module templates |

## API Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/api/therapist/modules` | List accessible modules (system + org + private) | Bearer token |
| POST | `/api/therapist/modules` | Create a private module | Bearer token |
| GET | `/api/therapist/modules/[id]` | Get module details | Bearer token |
| PUT | `/api/therapist/modules/[id]` | Update a private module | Bearer token |
| DELETE | `/api/therapist/modules/[id]` | Archive a private module | Bearer token |
| GET | `/api/org-admin/modules` | List organization modules | Bearer token |
| POST | `/api/org-admin/modules` | Create organization module | Bearer token |
| PUT | `/api/org-admin/modules/[id]` | Update organization module | Bearer token |
| GET | `/api/super-admin/module-templates` | List system templates | Bearer token |
| POST | `/api/super-admin/module-templates` | Create system template | Bearer token |
| PUT | `/api/super-admin/module-templates/[id]` | Update system template | Bearer token |
| GET | `/api/modules` | List modules (general) | Bearer token |
| GET | `/api/modules/[id]` | Get module by ID | Bearer token |
| POST | `/api/modules/[id]/generate-story-page` | Generate story page from module analysis | Bearer token |
| POST | `/api/sessions/[id]/assign-module` | Assign module to a session | Bearer token |
| POST | `/api/sessions/[id]/analyze-with-module` | Run AI analysis with assigned module | Bearer token |

## Database Tables

| Table | Role in Feature |
|---|---|
| `treatment_modules` | Core module definitions with name, domain, description, scope, AI prompt text, metadata, use count, status |
| `session_modules` | Junction table linking sessions to modules; stores assignment context, AI analysis results, and story page generation state |
| `module_ai_prompts` | Reusable AI prompt definitions that can be linked to modules |
| `module_prompt_links` | Junction table linking modules to AI prompts with sort order |

## Key Files

| File | Purpose |
|---|---|
| `src/services/ModuleService.ts` | Core business logic: CRUD, listing with scope filtering, domain filtering, approval workflow, template operations |
| `src/app/api/therapist/modules/route.ts` | Therapist module API (list + create) |
| `src/app/api/therapist/modules/[id]/route.ts` | Therapist module detail API (get + update + delete) |
| `src/app/api/org-admin/modules/route.ts` | Org admin module API |
| `src/app/api/super-admin/module-templates/route.ts` | Super admin template API |
| `src/app/api/modules/[id]/generate-story-page/route.ts` | Story page generation from module |
| `src/app/api/sessions/[id]/assign-module/route.ts` | Module-to-session assignment |
| `src/app/api/sessions/[id]/analyze-with-module/route.ts` | AI analysis execution |
| `src/services/StoryPageGeneratorService.ts` | Auto-generate story pages from module analysis |
| `src/models/Schema.ts` | Database schema: `treatmentModulesSchema`, `sessionModulesSchema`, `moduleAiPromptsSchema`, `modulePromptLinksSchema` |

## Technical Notes

- **Scope Visibility**: `listModules()` implements compound scope filtering: users see `system` modules + their `organization` modules (if they have an org) + their own `private` modules.
- **Use Count Tracking**: Each time a module is assigned to a session, its `use_count` is incremented via `incrementModuleUseCount()`.
- **AI Analysis Result**: The `session_modules.ai_analysis_result` JSONB column stores the structured output from the module-specific AI prompt, typically including `thematicSummary`, `patientQuotes`, and `clinicalInsights`.
- **Template Copying**: Org admins can copy system templates to their organization scope via `copyTemplateToOrg()`, creating an independent copy with optional custom name.
- **Linked Prompts**: Modules can reference multiple AI prompts via `module_prompt_links` with a `sort_order` for sequenced execution. The `listTemplates()` function fetches linked prompts via an inner join.
- **Story Page Auto-Generation**: When `generateStoryPageFromModule()` is called, it creates a draft page with intro text, media blocks (up to 5), quote blocks, and clinical insight blocks from the AI analysis.
