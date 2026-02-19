# Reflections and Surveys

## Overview

Reflections and surveys are interactive question-response blocks embedded within story pages. Reflections capture qualitative patient insights through open-text responses. Surveys collect quantitative and qualitative data via multiple choice, scale, and emotion question types. Both support template systems with scope-based visibility (system, organization, private).

> **Callout:** Reflections are designed for deep qualitative exploration (open text only), while surveys support structured data collection with scales, multiple choice, and emotion selectors.

## User Roles

| Role | Access Level |
|---|---|
| **Super Admin** | Manage system-scope reflection and survey templates |
| **Org Admin** | Manage organization-scope templates; view all responses in org |
| **Therapist** | Create private templates; add reflection/survey blocks to pages; view patient responses |
| **Patient** | Answer reflection and survey questions on published pages |

## User Workflow

1. **Therapist Adds Questions** -- When creating/editing a story page, the therapist adds a `reflection` or `survey` block and defines questions within it.
2. **Template Use (Optional)** -- Therapists can select from existing templates (system, organization, or private scope) to pre-populate questions.
3. **Patient Responds** -- When viewing a published page, patients see the questions and submit their responses.
4. **Therapist Reviews** -- Therapists view responses on the dashboard (recent responses) or on the dedicated responses page (`/therapist/responses`).

## Question Types

### Reflection Questions

| Type | Description |
|---|---|
| `open_text` | Free-form text response (the only supported reflection type) |

### Survey Questions

| Type | Description |
|---|---|
| `open_text` | Free-form text response |
| `multiple_choice` | Select from predefined options (stored as JSON array) |
| `scale` | Numeric scale with configurable min/max and labels |
| `emotion` | Emotion picker response |

## UI Pages

| Page | Path | Description |
|---|---|---|
| Therapist Responses List | `/(auth)/therapist/responses` | View all patient responses across pages |
| Therapist Response Detail | `/(auth)/therapist/responses/[pageId]` | View responses for a specific page |
| Therapist Templates | `/(auth)/therapist/templates` | Manage private reflection/survey templates |
| Org Admin Templates | `/(auth)/org-admin/templates` | Manage organization-scope templates |
| Super Admin Templates | `/(auth)/super-admin/templates` | Manage system-scope templates |
| Patient Story View | `/(auth)/patient/story/[id]` | Patient answers questions inline |

## API Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/api/questions/reflection?blockIds=id1,id2` | Fetch reflection questions for specified blocks | Bearer token |
| GET | `/api/questions/survey?blockIds=id1,id2` | Fetch survey questions for specified blocks | Bearer token |
| POST | `/api/responses/reflection` | Submit reflection responses (patient only) | Bearer token |
| POST | `/api/responses/survey` | Submit survey responses (patient only) | Bearer token |
| POST | `/api/pages/[id]/responses` | Submit both reflection and survey responses | Bearer token |
| GET | `/api/therapist/responses` | List responses for therapist's patients | Bearer token |
| GET | `/api/therapist/responses/[pageId]` | Get responses for a specific page | Bearer token |
| GET | `/api/dashboard/recent-responses` | Recent reflection and survey responses | Bearer token |
| GET | `/api/templates/reflections` | List reflection templates | Bearer token |
| GET | `/api/templates/surveys` | List survey templates | Bearer token |
| GET | `/api/templates/[type]` | List templates by type | Bearer token |
| POST | `/api/templates/[type]` | Create a template | Bearer token |
| PUT | `/api/templates/[type]/[id]` | Update a template | Bearer token |
| DELETE | `/api/templates/[type]/[id]` | Delete a template | Bearer token |
| POST | `/api/templates/[type]/[id]/approve` | Approve a pending template | Bearer token |
| POST | `/api/templates/[type]/[id]/reject` | Reject a pending template | Bearer token |
| GET | `/api/templates/pending` | List pending templates awaiting approval | Bearer token |

## Database Tables

| Table | Role in Feature |
|---|---|
| `reflection_questions` | Questions attached to reflection blocks; fields: `question_text`, `question_type` (open_text), `sequence_number` |
| `survey_questions` | Questions attached to survey blocks; fields: `question_text`, `question_type`, `scale_min/max`, `scale_min/max_label`, `options` (JSON), `sequence_number` |
| `reflection_responses` | Patient text responses; references `reflection_questions`, `story_pages`, and `users` |
| `survey_responses` | Patient responses with `response_value` (text) and `response_numeric` (integer for scale) |
| `page_blocks` | Parent blocks with `block_type` of `reflection` or `survey` |
| `reflection_templates` | Reusable reflection question sets with scope-based visibility |
| `survey_templates` | Reusable survey question sets with scope-based visibility |

## Key Files

| File | Purpose |
|---|---|
| `src/app/api/questions/reflection/route.ts` | Fetch reflection questions with RBAC and HIPAA audit logging |
| `src/app/api/questions/survey/route.ts` | Fetch survey questions with RBAC and HIPAA audit logging |
| `src/app/api/responses/reflection/route.ts` | Submit reflection responses (patient-only, with upsert logic) |
| `src/app/api/responses/survey/route.ts` | Submit survey responses (patient-only) |
| `src/app/api/pages/[id]/responses/route.ts` | Combined reflection + survey response submission |
| `src/app/api/dashboard/recent-responses/route.ts` | Recent responses for dashboard |
| `src/app/api/therapist/responses/route.ts` | Therapist view of patient responses |
| `src/app/api/templates/reflections/route.ts` | Reflection template management |
| `src/app/api/templates/surveys/route.ts` | Survey template management |
| `src/models/Schema.ts` | Database schema: `reflectionQuestionsSchema`, `surveyQuestionsSchema`, `reflectionResponsesSchema`, `surveyResponsesSchema` |

## Technical Notes

- **HIPAA Access Control**: Reflection and survey question APIs enforce strict RBAC:
  - Patients can only access questions on their assigned, published pages.
  - Therapists can only access questions on their patients' pages.
  - Org admins are scoped to their organization.
  - Super admins have full access.
- **Audit Logging**: All PHI access to questions and responses is logged to the `audit_logs` table via `logAuditFromRequest()`.
- **Upsert Pattern**: Reflection response submission uses upsert logic -- if a response already exists for the same patient/question/page combination, it is updated rather than duplicated.
- **Template Scopes**: Templates use the `template_scope` enum (`system`, `organization`, `private`):
  - `system` -- visible to all users, managed by super admins.
  - `organization` -- visible to users in the same organization, managed by org admins.
  - `private` -- visible only to the creator.
- **Zod Validation**: Response submissions are validated with Zod schemas including UUID format checks, text length limits (max 10,000 chars), and array size limits (max 100 responses per request).
- **Questions are block-scoped**: Questions belong to specific `page_blocks`, not directly to pages. This allows multiple reflection or survey blocks per page with independent question sets.
