# Database Schema Reference

> [!IMPORTANT]
> This is the complete column-by-column reference for all 48 database tables in StoryCare. All schema definitions live in a single file: **`src/models/Schema.ts`**. The ORM is DrizzleORM targeting Neon (Serverless PostgreSQL).

---

## Table Index

| # | Table Name | Domain | Columns | Indexes | Soft Delete |
|---|---|---|---|---|---|
| 1 | [ai_chat_messages](#ai_chat_messages) | AI Chat | 16 | - | No |
| 2 | [ai_models](#ai_models) | AI Models | 16 | 3 | No |
| 3 | [assessment_instruments](#assessment_instruments) | Clinical Assessments | 15 | - | No |
| 4 | [assessment_instrument_items](#assessment_instrument_items) | Clinical Assessments | 13 | 2 | No |
| 5 | [assessment_responses](#assessment_responses) | Clinical Assessments | 8 | 2 | No |
| 6 | [assessment_sessions](#assessment_sessions) | Clinical Assessments | 15 | 5 | No |
| 7 | [audit_logs](#audit_logs) | Platform | 11 | - | No |
| 8 | [email_notifications](#email_notifications) | Email | 14 | - | No |
| 9 | [feature_toggles](#feature_toggles) | Platform | 6 | - | No |
| 10 | [group_members](#group_members) | Users & Orgs | 5 | 1 | No |
| 11 | [groups](#groups) | Users & Orgs | 7 | - | No |
| 12 | [media_library](#media_library) | Media & Assets | 24 | 1 | Yes |
| 13 | [module_ai_prompts](#module_ai_prompts) | Templates & Modules | 18 | - | No |
| 14 | [module_prompt_links](#module_prompt_links) | Templates & Modules | 5 | - | No |
| 15 | [music_generation_tasks](#music_generation_tasks) | Media & Assets | 25 | - | No |
| 16 | [notes](#notes) | Media & Assets | 8 | - | No |
| 17 | [organizations](#organizations) | Users & Orgs | 9 | - | No |
| 18 | [page_blocks](#page_blocks) | Story Pages | 9 | - | No |
| 19 | [page_share_links](#page_share_links) | Story Pages | 10 | - | No |
| 20 | [patient_page_interactions](#patient_page_interactions) | Story Pages | 9 | - | No |
| 21 | [patient_reference_images](#patient_reference_images) | Users & Orgs | 8 | - | Yes |
| 22 | [platform_settings](#platform_settings) | Platform | 15 | - | No |
| 23 | [quotes](#quotes) | Media & Assets | 11 | - | No |
| 24 | [recording_links](#recording_links) | Recordings | 13 | - | No |
| 25 | [reflection_questions](#reflection_questions) | Story Pages | 5 | - | No |
| 26 | [reflection_responses](#reflection_responses) | Story Pages | 7 | - | No |
| 27 | [reflection_templates](#reflection_templates) | Templates & Modules | 13 | - | No |
| 28 | [scene_audio_tracks](#scene_audio_tracks) | Scenes & Video | 9 | - | No |
| 29 | [scene_clips](#scene_clips) | Scenes & Video | 6 | - | No |
| 30 | [scenes](#scenes) | Scenes & Video | 16 | - | No |
| 31 | [session_modules](#session_modules) | Templates & Modules | 10 | - | No |
| 32 | [sessions](#sessions) | Sessions | 21 | - | Yes |
| 33 | [speakers](#speakers) | Sessions | 9 | - | No |
| 34 | [story_pages](#story_pages) | Story Pages | 17 | - | No |
| 35 | [survey_questions](#survey_questions) | Story Pages | 9 | - | No |
| 36 | [survey_responses](#survey_responses) | Story Pages | 6 | - | No |
| 37 | [survey_templates](#survey_templates) | Templates & Modules | 13 | - | No |
| 38 | [therapeutic_prompts](#therapeutic_prompts) | Templates & Modules | 16 | - | No |
| 39 | [therapist_patient_archives](#therapist_patient_archives) | Users & Orgs | 5 | 2 | No |
| 40 | [transcripts](#transcripts) | Sessions | 7 | - | Yes |
| 41 | [treatment_modules](#treatment_modules) | Templates & Modules | 11 | - | No |
| 42 | [uploaded_recordings](#uploaded_recordings) | Recordings | 14 | 3 | No |
| 43 | [user_prompt_order](#user_prompt_order) | Templates & Modules | 5 | 1 | No |
| 44 | [users](#users) | Users & Orgs | 36 | - | Yes |
| 45 | [utterances](#utterances) | Sessions | 8 | - | No |
| 46 | [video_processing_jobs](#video_processing_jobs) | Scenes & Video | 18 | - | No |
| 47 | [video_transcoding_jobs](#video_transcoding_jobs) | Scenes & Video | 20 | - | No |
| 48 | [workflow_executions](#workflow_executions) | Templates & Modules | 14 | - | No |

---

## Enum Reference

| Enum Name | Values |
|---|---|
| `user_role` | `super_admin`, `org_admin`, `therapist`, `patient` |
| `user_status` | `pending_approval`, `invited`, `active`, `inactive`, `rejected`, `deleted` |
| `organization_status` | `active`, `suspended` |
| `template_scope` | `system`, `organization`, `private` |
| `template_status` | `active`, `pending_approval`, `rejected`, `archived` |
| `template_category` | `screening`, `outcome`, `satisfaction`, `custom`, `narrative`, `emotion`, `goal-setting` |
| `session_type` | `individual`, `group` |
| `transcription_status` | `pending`, `processing`, `completed`, `failed` |
| `speaker_type` | `therapist`, `patient`, `group_member` |
| `media_type` | `image`, `video`, `audio` |
| `source_type` | `generated`, `uploaded`, `scene`, `animated_from_image`, `therapist_created`, `extracted` |
| `media_status` | `processing`, `completed`, `failed` |
| `priority` | `low`, `medium`, `high` |
| `scene_status` | `draft`, `processing`, `completed`, `failed` |
| `job_status` | `pending`, `processing`, `completed`, `failed` |
| `job_type` | `scene_assembly`, `video_generation`, `transcoding`, `extract_frame`, `merge_audio_chunks` |
| `block_type` | `video`, `image`, `audio`, `text`, `quote`, `note`, `scene`, `reflection`, `survey` |
| `page_status` | `draft`, `published`, `archived` |
| `visibility` | `private`, `patient_only` |
| `reflection_question_type` | `open_text` |
| `survey_question_type` | `open_text`, `multiple_choice`, `scale`, `emotion` |
| `question_type` | `open_text`, `multiple_choice`, `scale`, `emotion` *(legacy)* |
| `audit_action` | `create`, `read`, `update`, `delete`, `export`, `auth_success`, `auth_failed`, `logout` |
| `chat_role` | `user`, `assistant`, `system` |
| `music_generation_status` | `pending`, `processing`, `completed`, `failed` |
| `transcoding_job_status` | `pending`, `running`, `completed`, `failed`, `cancelled` |
| `transcoding_format` | `h264`, `h265`, `vp9`, `av1` |
| `transcoding_quality` | `low`, `medium`, `high`, `ultra` |
| `therapeutic_domain` | `self_strength`, `relationships_repair`, `identity_transformation`, `purpose_future` |
| `module_status` | `active`, `archived`, `pending_approval` |
| `notification_type` | `story_page_published`, `module_completed`, `session_reminder`, `survey_reminder`, `therapist_invitation`, `patient_invitation`, `org_admin_invitation` |
| `notification_status` | `pending`, `sent`, `failed`, `bounced`, `opened`, `clicked` |
| `generation_source` | `manual`, `module_auto`, `ai_suggested` |
| `recording_source` | `direct`, `share_link` |
| `uploaded_recording_status` | `recording`, `uploading`, `merging`, `completed`, `failed`, `used` |
| `recording_link_status` | `pending`, `recording`, `completed`, `expired`, `revoked` |
| `instrument_type` | `ptsd`, `depression`, `schizophrenia`, `substance_use`, `anxiety`, `enrollment`, `general` |
| `assessment_timepoint` | `screening`, `baseline`, `mid_treatment`, `post_treatment`, `follow_up_1m`, `follow_up_3m`, `follow_up_6m`, `follow_up_12m`, `other` |
| `assessment_session_status` | `in_progress`, `completed`, `abandoned` |
| `instrument_status` | `active`, `inactive` |
| `assessment_item_type` | `likert`, `multi_choice`, `open_text`, `select`, `number`, `date` |
| `model_category` | `text_to_image`, `image_to_image`, `image_to_text`, `text_to_text`, `text_to_video`, `image_to_video`, `music_generation`, `transcription` |
| `model_status` | `active`, `hidden`, `deprecated`, `disabled` |
| `pricing_unit` | `per_image`, `per_second`, `per_minute`, `per_1k_tokens`, `per_request` |

---

## Table Definitions

---

### organizations

> [!NOTE]
> Multi-tenant organization entity. Stores subscription tier, feature limits, branding, and default settings in a JSONB `settings` column.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `name` | varchar(255) | - | No | Organization display name |
| `slug` | varchar(100) | - | No | URL-safe identifier; **UNIQUE** |
| `contact_email` | varchar(255) | - | No | Primary contact email |
| `logo_url` | text | - | Yes | Organization logo URL |
| `primary_color` | varchar(7) | - | Yes | Hex color code (e.g., `#4F46E5`) |
| `settings` | jsonb | See below | No | Subscription tier, feature limits, branding |
| `status` | `organization_status` | `'active'` | No | `active` or `suspended` |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |
| `created_by` | uuid | - | Yes | FK to `users.id` (super admin); nullable for bootstrap |

**JSONB: `settings`**
```json
{
  "subscriptionTier": "basic",
  "features": {
    "maxTherapists": 5,
    "maxPatients": 50,
    "aiCreditsPerMonth": 1000,
    "storageGB": 10
  },
  "defaults": {
    "reflectionQuestions": [],
    "surveyTemplate": null,
    "sessionTranscriptionEnabled": true
  },
  "branding": {
    "welcomeMessage": null,
    "supportEmail": null
  }
}
```

**Constraints**: `slug` is UNIQUE.

---

### users

> [!NOTE]
> Central user table covering all roles: super_admin, org_admin, therapist, and patient. Contains demographics, invitation workflow fields, password reset tokens, and HIPAA soft-delete support. Self-referencing FK for therapist-patient relationship.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `email` | varchar(255) | - | Yes | **UNIQUE**; nullable for pre-creation |
| `name` | varchar(255) | - | No | Display name |
| `role` | `user_role` | - | No | `super_admin`, `org_admin`, `therapist`, `patient` |
| `organization_id` | uuid | - | Yes | FK to `organizations.id` (ON DELETE RESTRICT) |
| `status` | `user_status` | `'active'` | No | Workflow status |
| `avatar_url` | text | - | Yes | Profile image URL |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |
| `last_login_at` | timestamp | - | Yes | Last login timestamp |
| `license_number` | varchar(100) | - | Yes | Therapist license number |
| `specialty` | text | - | Yes | Therapist specialty description |
| `therapist_id` | uuid | - | Yes | FK to `users.id` (self-ref); patient's assigned therapist |
| `date_of_birth` | date | - | Yes | Patient DOB |
| `reference_image_url` | text | - | Yes | Patient reference image for AI generation (legacy; see `patient_reference_images`) |
| `gender` | varchar(50) | - | Yes | Patient gender |
| `pronouns` | varchar(100) | - | Yes | Patient pronouns |
| `language` | varchar(50) | - | Yes | Patient preferred language |
| `notes` | text | - | Yes | Free-text notes about user |
| `phone_number` | varchar(50) | - | Yes | Patient phone |
| `address_line_1` | varchar(255) | - | Yes | Street address line 1 |
| `address_line_2` | varchar(255) | - | Yes | Street address line 2 |
| `city` | varchar(100) | - | Yes | City |
| `state` | varchar(100) | - | Yes | State/Province |
| `country` | varchar(100) | - | Yes | Country |
| `zip_code` | varchar(20) | - | Yes | Postal code |
| `emergency_contact_name` | varchar(255) | - | Yes | Emergency contact name |
| `emergency_contact_relationship` | varchar(100) | - | Yes | Relationship to patient |
| `emergency_contact_phone` | varchar(50) | - | Yes | Emergency contact phone |
| `emergency_contact_email` | varchar(255) | - | Yes | Emergency contact email |
| `firebase_uid` | varchar(255) | - | Yes | **UNIQUE**; Google Identity Platform UID |
| `invitation_token` | varchar(64) | - | Yes | **UNIQUE**; one-time use token |
| `invitation_token_expires_at` | timestamp | - | Yes | Token expiration |
| `invitation_sent_at` | timestamp | - | Yes | When invitation email was sent |
| `invited_by` | uuid | - | Yes | Who created the invitation |
| `approved_by` | uuid | - | Yes | Super admin who approved |
| `approved_at` | timestamp | - | Yes | Approval timestamp |
| `rejected_by` | uuid | - | Yes | Super admin who rejected |
| `rejected_at` | timestamp | - | Yes | Rejection timestamp |
| `rejection_reason` | text | - | Yes | Reason for rejection |
| `password_reset_token` | varchar(64) | - | Yes | **UNIQUE**; one-time use |
| `password_reset_token_expires_at` | timestamp | - | Yes | Reset token expiration |
| `deleted_at` | timestamp | - | Yes | Soft delete (HIPAA compliance) |

**Foreign Keys**: `organization_id` -> `organizations.id` (RESTRICT), `therapist_id` -> `users.id` (self-ref).

**Unique Constraints**: `email`, `firebase_uid`, `invitation_token`, `password_reset_token`.

---

### patient_reference_images

> [!NOTE]
> Multiple reference images per patient for AI image generation personalization. One image can be marked as primary.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `patient_id` | uuid | - | No | FK to `users.id` (CASCADE) |
| `image_url` | text | - | No | GCS path to image |
| `label` | varchar(255) | - | Yes | Optional label or notes |
| `is_primary` | boolean | `false` | No | Whether this is the primary reference image |
| `uploaded_by` | uuid | - | No | FK to `users.id` |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |
| `deleted_at` | timestamp | - | Yes | Soft delete (HIPAA) |

**Foreign Keys**: `patient_id` -> `users.id` (CASCADE), `uploaded_by` -> `users.id`.

---

### groups

> [!NOTE]
> Patient groups for group therapy sessions. Scoped to an organization and owned by a therapist.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `name` | varchar(255) | - | No | Group name |
| `description` | text | - | Yes | Group description |
| `organization_id` | uuid | - | No | FK to `organizations.id` (CASCADE) |
| `therapist_id` | uuid | - | No | FK to `users.id` |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |
| `archived_at` | timestamp | - | Yes | Archival timestamp |

**Foreign Keys**: `organization_id` -> `organizations.id` (CASCADE), `therapist_id` -> `users.id`.

---

### group_members

> [!NOTE]
> Junction table linking patients to groups. Tracks when members joined and optionally left.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `group_id` | uuid | - | Yes | FK to `groups.id` (CASCADE) |
| `patient_id` | uuid | - | Yes | FK to `users.id` (CASCADE) |
| `joined_at` | timestamp | `now()` | No | When member joined |
| `left_at` | timestamp | - | Yes | When member left (null = active) |

**Foreign Keys**: `group_id` -> `groups.id` (CASCADE), `patient_id` -> `users.id` (CASCADE).

**Indexes**: `group_members_group_id_idx` on `group_id`.

---

### therapist_patient_archives

> [!NOTE]
> Per-therapist patient visibility. Allows therapists to hide patients from their personal view without affecting other users or deleting the patient.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `therapist_id` | uuid | - | No | FK to `users.id` (CASCADE) |
| `patient_id` | uuid | - | No | FK to `users.id` (CASCADE) |
| `archived_at` | timestamp | `now()` | No | When archived |
| `created_at` | timestamp | `now()` | No | Creation timestamp |

**Foreign Keys**: `therapist_id` -> `users.id` (CASCADE), `patient_id` -> `users.id` (CASCADE).

**Unique Constraints**: `therapist_patient_archive_unique` on (`therapist_id`, `patient_id`).

**Indexes**: `therapist_patient_archives_therapist_idx` on `therapist_id`, `therapist_patient_archives_patient_idx` on `patient_id`.

---

### sessions

> [!NOTE]
> Core therapy session record. Links to therapist, patient (individual) or group, and audio file in GCS. Tracks transcription status, module assignment, AI-generated summary, and speaker setup.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `title` | varchar(255) | - | No | Session title |
| `session_date` | date | - | No | Date of session |
| `session_type` | `session_type` | - | No | `individual` or `group` |
| `therapist_id` | uuid | - | No | FK to `users.id` |
| `patient_id` | uuid | - | Yes | FK to `users.id`; set for individual sessions |
| `group_id` | uuid | - | Yes | FK to `groups.id`; set for group sessions |
| `audio_url` | text | - | No | GCS path to audio file |
| `audio_duration_seconds` | integer | - | Yes | Audio duration |
| `audio_file_size_bytes` | bigint | - | Yes | Audio file size |
| `transcription_status` | `transcription_status` | `'pending'` | Yes | Processing status |
| `transcription_error` | text | - | Yes | Error message if transcription failed |
| `module_id` | uuid | - | Yes | Treatment module ID (no FK constraint) |
| `module_assigned_at` | timestamp | - | Yes | When module was assigned |
| `session_summary` | text | - | Yes | AI-generated session summary |
| `session_summary_generated_at` | timestamp | - | Yes | When summary was generated |
| `session_summary_model` | varchar(50) | - | Yes | AI model used for summary |
| `speakers_setup_completed` | boolean | `false` | Yes | Whether speakers have been labeled |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |
| `last_opened_at` | timestamp | - | Yes | Last time session was viewed |
| `archived_at` | timestamp | - | Yes | Session archival timestamp |
| `deleted_at` | timestamp | - | Yes | Soft delete (HIPAA) |

**Foreign Keys**: `therapist_id` -> `users.id`, `patient_id` -> `users.id`, `group_id` -> `groups.id`.

---

### transcripts

> [!NOTE]
> Full transcript of a session produced by Deepgram. One-to-one with sessions (session_id is UNIQUE).

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `session_id` | uuid | - | No | FK to `sessions.id` (CASCADE); **UNIQUE** |
| `full_text` | text | - | No | Complete transcript text |
| `confidence_score` | decimal(5,4) | - | Yes | Overall Deepgram confidence |
| `language_code` | varchar(10) | `'en'` | Yes | Detected language |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |
| `deleted_at` | timestamp | - | Yes | Soft delete (HIPAA) |

**Foreign Keys**: `session_id` -> `sessions.id` (CASCADE).

**Unique Constraints**: `session_id` is UNIQUE (1:1 with sessions).

---

### speakers

> [!NOTE]
> Identified speakers in a transcript from Deepgram diarization. Therapists label speaker type and name after transcription.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `transcript_id` | uuid | - | No | FK to `transcripts.id` (CASCADE) |
| `speaker_label` | varchar(50) | - | No | Diarization label (e.g., `Speaker 0`) |
| `speaker_type` | `speaker_type` | - | Yes | `therapist`, `patient`, `group_member` |
| `speaker_name` | varchar(255) | - | Yes | Human-assigned name |
| `user_id` | uuid | - | Yes | FK to `users.id`; links to patient record |
| `total_utterances` | integer | `0` | Yes | Count of utterances |
| `total_duration_seconds` | integer | `0` | Yes | Total speaking time |
| `created_at` | timestamp | `now()` | No | Creation timestamp |

**Foreign Keys**: `transcript_id` -> `transcripts.id` (CASCADE), `user_id` -> `users.id`.

---

### utterances

> [!NOTE]
> Individual speech segments within a transcript. Each utterance belongs to a speaker and has precise timing information.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `transcript_id` | uuid | - | No | FK to `transcripts.id` (CASCADE) |
| `speaker_id` | uuid | - | No | FK to `speakers.id` (CASCADE) |
| `text` | text | - | No | Utterance text content |
| `start_time_seconds` | decimal(10,3) | - | No | Start time in seconds |
| `end_time_seconds` | decimal(10,3) | - | No | End time in seconds |
| `confidence_score` | decimal(5,4) | - | Yes | Deepgram confidence for this segment |
| `sequence_number` | integer | - | No | Order within transcript |
| `created_at` | timestamp | `now()` | No | Creation timestamp |

**Foreign Keys**: `transcript_id` -> `transcripts.id` (CASCADE), `speaker_id` -> `speakers.id` (CASCADE).

---

### ai_chat_messages

> [!NOTE]
> Session-scoped AI chat messages between therapist and AI assistant. Supports text and structured JSON output, transcript selection context, and conversation summarization.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `session_id` | uuid | - | No | FK to `sessions.id` (CASCADE) |
| `therapist_id` | uuid | - | No | FK to `users.id` |
| `role` | `chat_role` | - | No | `user`, `assistant`, `system` |
| `content` | text | - | No | Message content |
| `ai_model` | varchar(50) | - | Yes | Model used (e.g., `gpt-4o`, `gemini-2.5-pro`) |
| `selected_text` | text | - | Yes | Transcript text selection context |
| `selected_utterance_ids` | uuid[] | - | Yes | Array of utterance IDs for selection |
| `generated_media_id` | uuid | - | Yes | FK to `media_library.id` (no constraint) |
| `prompt_type` | varchar(100) | - | Yes | `image`, `video`, `analysis`, `quote`, etc. |
| `summary_up_to_message_id` | uuid | - | Yes | Last message ID included in summary |
| `message_type` | varchar(50) | `'text'` | Yes | `text`, `json`, `system`, `progress` |
| `json_data` | jsonb | - | Yes | Structured JSON data for `json` message type |
| `action_status` | varchar(50) | - | Yes | `pending`, `processing`, `completed`, `failed` |
| `created_at` | timestamp | `now()` | No | Creation timestamp |

**Foreign Keys**: `session_id` -> `sessions.id` (CASCADE), `therapist_id` -> `users.id`.

---

### media_library

> [!NOTE]
> Central media asset library. Stores images, videos, and audio generated by AI or uploaded by therapists. Tracks generation metadata, source provenance, and patient ownership. Self-referencing FK for derived media.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `patient_id` | uuid | - | Yes | FK to `users.id`; nullable for group media |
| `created_by_therapist_id` | uuid | - | No | FK to `users.id` |
| `title` | varchar(255) | - | No | Media title |
| `description` | text | - | Yes | Media description |
| `notes` | text | - | Yes | Therapist-only private notes |
| `media_type` | `media_type` | - | No | `image`, `video`, `audio` |
| `media_url` | text | - | No | GCS path or URL |
| `thumbnail_url` | text | - | Yes | Thumbnail URL |
| `file_size_bytes` | bigint | - | Yes | File size |
| `duration_seconds` | integer | - | Yes | For video/audio |
| `width_px` | integer | - | Yes | Image/video width |
| `height_px` | integer | - | Yes | Image/video height |
| `source_type` | `source_type` | - | No | `generated`, `uploaded`, `scene`, etc. |
| `source_session_id` | uuid | - | Yes | FK to `sessions.id` |
| `source_media_id` | uuid | - | Yes | FK to `media_library.id` (self-ref) |
| `scene_id` | uuid | - | Yes | Scene ID (no FK constraint) |
| `generation_prompt` | text | - | Yes | AI prompt used for generation |
| `ai_model` | varchar(100) | - | Yes | AI model identifier |
| `reference_image_url` | text | - | Yes | Reference image used for generation |
| `generation_metadata` | jsonb | - | Yes | AI generation params (fps, model, dimensions) |
| `chat_message_id` | uuid | - | Yes | AI chat message that triggered generation |
| `source_selection` | text | - | Yes | Transcript text that inspired the media |
| `tags` | text[] | - | Yes | Array of tag strings |
| `status` | `media_status` | `'completed'` | Yes | `processing`, `completed`, `failed` |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |
| `deleted_at` | timestamp | - | Yes | Soft delete (HIPAA) |

**Foreign Keys**: `patient_id` -> `users.id`, `created_by_therapist_id` -> `users.id`, `source_session_id` -> `sessions.id`, `source_media_id` -> `media_library.id` (self-ref).

**Indexes**: `media_library_patient_created_at_idx` on (`patient_id`, `created_at`).

---

### music_generation_tasks

> [!NOTE]
> Tracks Suno AI music generation tasks with request parameters, status polling, and result storage. Supports V4.5 and V5 advanced parameters.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `task_id` | varchar(255) | - | No | Internal task ID (format: `music_123_abc`); **UNIQUE** |
| `suno_task_id` | varchar(255) | - | Yes | Suno's external task ID |
| `status` | `music_generation_status` | `'pending'` | No | Task status |
| `progress` | integer | `0` | No | 0-100 percentage |
| `prompt` | text | - | Yes | Generation prompt |
| `style` | varchar(1000) | - | Yes | Music style description |
| `title` | varchar(100) | - | Yes | Song title |
| `model` | varchar(50) | `'V4_5'` | No | Suno model version |
| `custom_mode` | boolean | `false` | No | Custom mode flag |
| `instrumental` | boolean | `true` | No | Instrumental only (no vocals) |
| `persona_id` | varchar(255) | - | Yes | V5 persona reference |
| `negative_tags` | text | - | Yes | V5 negative style tags |
| `vocal_gender` | varchar(1) | - | Yes | `m` or `f` for vocal gender |
| `style_weight` | decimal(3,2) | - | Yes | V5 style weight 0.00-1.00 |
| `weirdness_constraint` | decimal(3,2) | - | Yes | V5 weirdness 0.00-1.00 |
| `audio_weight` | decimal(3,2) | - | Yes | V5 audio weight 0.00-1.00 |
| `media_id` | uuid | - | Yes | FK to `media_library.id` |
| `audio_url` | text | - | Yes | Suno audio URL |
| `duration` | integer | - | Yes | Duration in seconds |
| `error` | text | - | Yes | Error message |
| `retry_count` | integer | `0` | No | Number of retries |
| `patient_id` | uuid | - | No | FK to `users.id` |
| `session_id` | uuid | - | Yes | FK to `sessions.id` |
| `created_by_therapist_id` | uuid | - | No | FK to `users.id` |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |
| `completed_at` | timestamp | - | Yes | Completion timestamp |
| `dismissed_at` | timestamp | - | Yes | When therapist dismissed notification |

**Foreign Keys**: `media_id` -> `media_library.id`, `patient_id` -> `users.id`, `session_id` -> `sessions.id`, `created_by_therapist_id` -> `users.id`.

**Unique Constraints**: `task_id` is UNIQUE.

---

### quotes

> [!NOTE]
> Quotes extracted from session transcripts. Can be linked to specific speakers and timestamp ranges.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `patient_id` | uuid | - | No | FK to `users.id` |
| `session_id` | uuid | - | Yes | FK to `sessions.id` |
| `quote_text` | text | - | No | The extracted quote |
| `speaker_id` | uuid | - | Yes | FK to `speakers.id` |
| `start_time_seconds` | decimal(10,3) | - | Yes | Start timestamp in audio |
| `end_time_seconds` | decimal(10,3) | - | Yes | End timestamp in audio |
| `tags` | text[] | - | Yes | Tag array |
| `notes` | text | - | Yes | Therapist notes |
| `created_by_therapist_id` | uuid | - | No | FK to `users.id` |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |

**Foreign Keys**: `patient_id` -> `users.id`, `session_id` -> `sessions.id`, `speaker_id` -> `speakers.id`, `created_by_therapist_id` -> `users.id`.

---

### notes

> [!NOTE]
> Therapist notes about patients, optionally linked to a session.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `patient_id` | uuid | - | No | FK to `users.id` |
| `therapist_id` | uuid | - | No | FK to `users.id` |
| `title` | varchar(255) | - | Yes | Note title |
| `content` | text | - | No | Note content |
| `session_id` | uuid | - | Yes | FK to `sessions.id` |
| `tags` | text[] | - | Yes | Tag array |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |

**Foreign Keys**: `patient_id` -> `users.id`, `therapist_id` -> `users.id`, `session_id` -> `sessions.id`.

---

### survey_templates

> [!NOTE]
> Reusable survey question templates with scope-based visibility (system, organization, private) and approval workflow.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `scope` | `template_scope` | `'private'` | No | `system`, `organization`, `private` |
| `organization_id` | uuid | - | Yes | FK to `organizations.id` (CASCADE) |
| `created_by` | uuid | - | No | FK to `users.id` |
| `approved_by` | uuid | - | Yes | FK to `users.id` |
| `approved_at` | timestamp | - | Yes | Approval timestamp |
| `status` | `template_status` | `'active'` | No | Approval workflow status |
| `rejection_reason` | text | - | Yes | Why template was rejected |
| `title` | varchar(255) | - | No | Template title |
| `description` | text | - | Yes | Template description |
| `category` | `template_category` | `'custom'` | No | Classification category |
| `questions` | jsonb | - | No | Array of question objects |
| `use_count` | integer | `0` | No | Number of times used |
| `metadata` | jsonb | - | Yes | Additional metadata |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |

**Foreign Keys**: `organization_id` -> `organizations.id` (CASCADE), `created_by` -> `users.id`, `approved_by` -> `users.id`.

---

### reflection_templates

> [!NOTE]
> Reusable reflection question templates. Same structure as survey_templates but for qualitative reflections.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `scope` | `template_scope` | `'private'` | No | `system`, `organization`, `private` |
| `organization_id` | uuid | - | Yes | FK to `organizations.id` (CASCADE) |
| `created_by` | uuid | - | No | FK to `users.id` |
| `approved_by` | uuid | - | Yes | FK to `users.id` |
| `approved_at` | timestamp | - | Yes | Approval timestamp |
| `status` | `template_status` | `'active'` | No | Approval workflow status |
| `rejection_reason` | text | - | Yes | Why template was rejected |
| `title` | varchar(255) | - | No | Template title |
| `description` | text | - | Yes | Template description |
| `category` | `template_category` | `'custom'` | No | Classification category |
| `questions` | jsonb | - | No | Array of question objects |
| `use_count` | integer | `0` | No | Number of times used |
| `metadata` | jsonb | - | Yes | Additional metadata |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |

**Foreign Keys**: `organization_id` -> `organizations.id` (CASCADE), `created_by` -> `users.id`, `approved_by` -> `users.id`.

---

### therapeutic_prompts

> [!NOTE]
> Reusable AI prompts for therapeutic purposes (image generation, video generation, analysis, reflection). Supports scope-based visibility and approval workflow.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `scope` | `template_scope` | `'private'` | No | `system`, `organization`, `private` |
| `organization_id` | uuid | - | Yes | FK to `organizations.id` (CASCADE) |
| `created_by` | uuid | - | No | FK to `users.id` |
| `approved_by` | uuid | - | Yes | FK to `users.id` |
| `approved_at` | timestamp | - | Yes | Approval timestamp |
| `status` | `template_status` | `'active'` | No | Approval workflow status |
| `rejection_reason` | text | - | Yes | Why prompt was rejected |
| `therapist_id` | uuid | - | Yes | FK to `users.id` (DEPRECATED; use `created_by`) |
| `title` | varchar(255) | - | No | Prompt title |
| `description` | text | - | Yes | Prompt description |
| `prompt_text` | text | - | No | The actual prompt text |
| `category` | varchar(100) | - | No | `image-generation`, `video-generation`, `analysis`, `reflection` |
| `tags` | text[] | - | Yes | Tag array |
| `is_favorite` | boolean | `false` | Yes | Favorited by creator |
| `use_count` | integer | `0` | Yes | Number of times used |
| `metadata` | jsonb | - | Yes | Additional metadata |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |

**Foreign Keys**: `organization_id` -> `organizations.id` (CASCADE), `created_by` -> `users.id`, `approved_by` -> `users.id`, `therapist_id` -> `users.id`.

---

### treatment_modules

> [!NOTE]
> Pre-built therapeutic modules organized by domain. Each module contains AI prompt text and metadata for structured therapeutic analysis.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `name` | varchar(255) | - | No | Module name |
| `domain` | `therapeutic_domain` | - | No | `self_strength`, `relationships_repair`, `identity_transformation`, `purpose_future` |
| `description` | text | - | No | Module description |
| `scope` | `template_scope` | `'system'` | No | `system`, `organization`, `private` |
| `organization_id` | uuid | - | Yes | FK to `organizations.id` (CASCADE) |
| `created_by` | uuid | - | No | FK to `users.id` |
| `ai_prompt_text` | text | - | No | AI prompt for module analysis |
| `ai_prompt_metadata` | jsonb | - | Yes | `{ output_format, expected_fields }` |
| `use_count` | integer | `0` | No | Usage count |
| `status` | `module_status` | `'active'` | No | `active`, `archived`, `pending_approval` |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |

**Foreign Keys**: `organization_id` -> `organizations.id` (CASCADE), `created_by` -> `users.id`.

---

### module_ai_prompts

> [!NOTE]
> AI prompt definitions for the prompt library. Supports both text-based and building-blocks workflow definitions with structured JSON output schemas.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `name` | varchar(255) | - | No | Prompt name |
| `prompt_text` | text | - | No | DEPRECATED: Use `system_prompt` instead |
| `system_prompt` | text | - | Yes | Hidden AI system instructions |
| `user_prompt` | text | - | Yes | Optional user-facing prompt text |
| `description` | text | - | Yes | Prompt description |
| `category` | varchar(100) | - | No | `analysis`, `creative`, `extraction`, `reflection` |
| `icon` | varchar(50) | `'sparkles'` | Yes | Icon name for UI |
| `output_type` | varchar(50) | `'text'` | Yes | `text` or `json` |
| `json_schema` | jsonb | - | Yes | JSON schema for structured outputs |
| `blocks` | jsonb | - | Yes | Array of BlockInstance[] for visual workflow |
| `use_advanced_mode` | boolean | `false` | Yes | True = JSON editor, false = building blocks |
| `scope` | `template_scope` | `'system'` | No | Visibility scope |
| `organization_id` | uuid | - | Yes | FK to `organizations.id` (CASCADE) |
| `created_by` | uuid | - | No | FK to `users.id` |
| `use_count` | integer | `0` | No | Usage count |
| `is_active` | boolean | `true` | No | Active status |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |

**Foreign Keys**: `organization_id` -> `organizations.id` (CASCADE), `created_by` -> `users.id`.

---

### module_prompt_links

> [!NOTE]
> Junction table linking treatment modules to AI prompts with display ordering.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `module_id` | uuid | - | No | FK to `treatment_modules.id` (CASCADE) |
| `prompt_id` | uuid | - | No | FK to `module_ai_prompts.id` (CASCADE) |
| `sort_order` | integer | `0` | No | Display order in UI |
| `created_at` | timestamp | `now()` | No | Creation timestamp |

**Foreign Keys**: `module_id` -> `treatment_modules.id` (CASCADE), `prompt_id` -> `module_ai_prompts.id` (CASCADE).

---

### user_prompt_order

> [!NOTE]
> Per-user custom ordering of prompts in the personal prompt library view.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `user_id` | uuid | - | No | FK to `users.id` (CASCADE) |
| `prompt_id` | uuid | - | No | FK to `module_ai_prompts.id` (CASCADE) |
| `sort_order` | integer | - | No | Display order |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |

**Foreign Keys**: `user_id` -> `users.id` (CASCADE), `prompt_id` -> `module_ai_prompts.id` (CASCADE).

**Unique Constraints**: `user_prompt_unique` on (`user_id`, `prompt_id`).

**Indexes**: `user_prompt_order_user_idx` on `user_id`.

---

### workflow_executions

> [!NOTE]
> Tracks execution state of building blocks workflows. Stores the block array with per-step status, accumulated context, and execution progress for resumability.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `prompt_id` | uuid | - | No | FK to `module_ai_prompts.id` (CASCADE) |
| `blocks` | jsonb | - | No | Array of BlockInstance[] with execution status |
| `context` | jsonb | - | No | WorkflowContext with accumulated step outputs |
| `initial_context` | jsonb | - | Yes | Original context at workflow start |
| `status` | varchar(50) | `'pending'` | No | `pending`, `running`, `completed`, `failed`, `paused` |
| `current_step_index` | integer | `0` | No | Current step being executed |
| `error` | text | - | Yes | Error message if failed |
| `session_id` | uuid | - | Yes | FK to `sessions.id` (CASCADE) |
| `patient_id` | uuid | - | Yes | FK to `users.id` (CASCADE) |
| `therapist_id` | uuid | - | Yes | FK to `users.id` (CASCADE) |
| `organization_id` | uuid | - | Yes | FK to `organizations.id` (CASCADE) |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `started_at` | timestamp | - | Yes | Execution start time |
| `completed_at` | timestamp | - | Yes | Execution end time |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |

**Foreign Keys**: `prompt_id` -> `module_ai_prompts.id` (CASCADE), `session_id` -> `sessions.id` (CASCADE), `patient_id` -> `users.id` (CASCADE), `therapist_id` -> `users.id` (CASCADE), `organization_id` -> `organizations.id` (CASCADE).

---

### session_modules

> [!NOTE]
> Links therapy sessions to treatment modules. Tracks AI analysis status/results and generated story page references.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `session_id` | uuid | - | No | FK to `sessions.id` (CASCADE) |
| `module_id` | uuid | - | Yes | FK to `treatment_modules.id` (SET NULL) |
| `assigned_by` | uuid | - | No | FK to `users.id` |
| `assigned_at` | timestamp | `now()` | No | Assignment timestamp |
| `ai_analysis_completed` | boolean | `false` | Yes | Whether analysis ran |
| `ai_analysis_result` | jsonb | - | Yes | Structured analysis output |
| `story_page_id` | uuid | - | Yes | FK to `story_pages.id` |
| `story_page_generated_at` | timestamp | - | Yes | When story page was generated |
| `notes` | text | - | Yes | Therapist notes |
| `created_at` | timestamp | `now()` | No | Creation timestamp |

**Foreign Keys**: `session_id` -> `sessions.id` (CASCADE), `module_id` -> `treatment_modules.id` (SET NULL), `assigned_by` -> `users.id`, `story_page_id` -> `story_pages.id`.

---

### email_notifications

> [!NOTE]
> Tracks HIPAA-compliant email notifications sent via Paubox. Records delivery status and engagement metrics.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `notification_type` | `notification_type` | - | No | Type of notification |
| `recipient_user_id` | uuid | - | No | FK to `users.id` |
| `recipient_email` | varchar(255) | - | No | Recipient email address |
| `subject` | varchar(255) | - | No | Email subject line |
| `body_text` | text | - | No | Plain text body |
| `body_html` | text | - | Yes | HTML body |
| `story_page_id` | uuid | - | Yes | FK to `story_pages.id` |
| `session_id` | uuid | - | Yes | FK to `sessions.id` |
| `module_id` | uuid | - | Yes | FK to `treatment_modules.id` |
| `status` | `notification_status` | `'pending'` | No | Delivery status |
| `sent_at` | timestamp | - | Yes | When email was sent |
| `opened_at` | timestamp | - | Yes | When email was opened |
| `clicked_at` | timestamp | - | Yes | When link was clicked |
| `error_message` | text | - | Yes | Delivery error |
| `external_id` | varchar(255) | - | Yes | Email service message ID |
| `created_at` | timestamp | `now()` | No | Creation timestamp |

**Foreign Keys**: `recipient_user_id` -> `users.id`, `story_page_id` -> `story_pages.id`, `session_id` -> `sessions.id`, `module_id` -> `treatment_modules.id`.

---

### scenes

> [!NOTE]
> Video scene compositions. Therapists arrange media clips and audio tracks on a timeline, then assemble into a final video.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `patient_id` | uuid | - | No | FK to `users.id` |
| `created_by_therapist_id` | uuid | - | No | FK to `users.id` |
| `title` | varchar(255) | - | Yes | Scene title |
| `description` | text | - | Yes | Scene description |
| `video_url` | text | - | Yes | Original video URL |
| `assembled_video_url` | text | - | Yes | Final assembled video URL |
| `thumbnail_url` | text | - | Yes | Thumbnail image URL |
| `duration_seconds` | varchar(50) | - | Yes | Total duration (stored as string) |
| `background_audio_url` | text | - | Yes | Legacy: single background audio |
| `loop_audio` | boolean | `false` | Yes | Legacy: loop audio flag |
| `loop_scenes` | boolean | `false` | Yes | Legacy: loop scenes flag |
| `fit_audio_to_duration` | boolean | `false` | Yes | Fit audio to scene duration |
| `status` | `scene_status` | `'draft'` | Yes | `draft`, `processing`, `completed`, `failed` |
| `processing_error` | text | - | Yes | Error during assembly |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |

**Foreign Keys**: `patient_id` -> `users.id`, `created_by_therapist_id` -> `users.id`.

---

### scene_clips

> [!NOTE]
> Individual media clips within a scene timeline, ordered by sequence number.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `scene_id` | uuid | - | No | FK to `scenes.id` (CASCADE) |
| `media_id` | uuid | - | Yes | FK to `media_library.id` |
| `sequence_number` | integer | - | No | Order in timeline |
| `start_time_seconds` | decimal(10,3) | `'0'` | Yes | Clip start time |
| `end_time_seconds` | decimal(10,3) | - | Yes | Clip end time |
| `created_at` | timestamp | `now()` | No | Creation timestamp |

**Foreign Keys**: `scene_id` -> `scenes.id` (CASCADE), `media_id` -> `media_library.id`.

---

### scene_audio_tracks

> [!NOTE]
> Audio layers within a scene. Multiple audio tracks can be layered with independent volume control and timing.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `scene_id` | uuid | - | No | FK to `scenes.id` (CASCADE) |
| `audio_id` | uuid | - | Yes | FK to `media_library.id` |
| `audio_url` | text | - | No | GCS URL or external URL |
| `title` | varchar(255) | - | Yes | Display name |
| `start_time_seconds` | decimal(10,3) | `'0'` | Yes | Audio start offset |
| `duration_seconds` | decimal(10,3) | - | Yes | Original audio duration |
| `volume` | integer | `100` | Yes | Volume 0-100% |
| `sequence_number` | integer | - | No | Layer ordering (z-index) |
| `created_at` | timestamp | `now()` | No | Creation timestamp |

**Foreign Keys**: `scene_id` -> `scenes.id` (CASCADE), `audio_id` -> `media_library.id`.

---

### story_pages

> [!NOTE]
> Patient-facing content pages built from media blocks, reflections, and surveys. Supports draft/publish workflow, shareable links, and treatment module integration.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `patient_id` | uuid | - | No | FK to `users.id` |
| `created_by_therapist_id` | uuid | - | No | FK to `users.id` |
| `title` | varchar(255) | - | No | Page title |
| `description` | text | - | Yes | Page description |
| `status` | `page_status` | `'draft'` | Yes | `draft`, `published`, `archived` |
| `visibility` | `visibility` | `'private'` | Yes | `private`, `patient_only` |
| `published_at` | timestamp | - | Yes | When page was published |
| `share_token` | varchar(64) | - | Yes | **UNIQUE**; legacy shareable token |
| `share_expires_at` | timestamp | - | Yes | Legacy token expiration |
| `share_expiry_duration` | varchar(20) | - | Yes | `15min`, `1hour`, `2hours` |
| `is_shareable` | boolean | `false` | Yes | Whether sharing is enabled |
| `module_id` | uuid | - | Yes | Treatment module ID (no FK constraint) |
| `auto_generated` | boolean | `false` | Yes | Whether page was auto-generated |
| `generation_source` | `generation_source` | `'manual'` | Yes | `manual`, `module_auto`, `ai_suggested` |
| `email_notification_id` | uuid | - | Yes | Email notification ID (no FK constraint) |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |

**Foreign Keys**: `patient_id` -> `users.id`, `created_by_therapist_id` -> `users.id`.

**Unique Constraints**: `share_token` is UNIQUE.

---

### page_share_links

> [!NOTE]
> Time-limited shareable links for story pages. Each link has its own expiration and access tracking.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `page_id` | uuid | - | No | FK to `story_pages.id` (CASCADE) |
| `token` | varchar(64) | - | No | **UNIQUE**; URL token |
| `expires_at` | timestamp | - | No | Expiration timestamp |
| `expiry_duration_minutes` | integer | - | No | e.g., 60 for 1 hour |
| `created_by_therapist_id` | uuid | - | No | FK to `users.id` |
| `is_active` | boolean | `true` | No | Active/revoked status |
| `revoked_at` | timestamp | - | Yes | When link was revoked |
| `access_count` | integer | `0` | No | Number of accesses |
| `last_accessed_at` | timestamp | - | Yes | Last access timestamp |
| `created_at` | timestamp | `now()` | No | Creation timestamp |

**Foreign Keys**: `page_id` -> `story_pages.id` (CASCADE), `created_by_therapist_id` -> `users.id`.

**Unique Constraints**: `token` is UNIQUE.

---

### page_blocks

> [!NOTE]
> Content blocks within a story page. Each block has a type (video, image, text, reflection, survey, etc.) and position.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `page_id` | uuid | - | No | FK to `story_pages.id` (CASCADE) |
| `block_type` | `block_type` | - | No | `video`, `image`, `audio`, `text`, `quote`, `note`, `scene`, `reflection`, `survey` |
| `sequence_number` | integer | - | No | Display order |
| `media_id` | uuid | - | Yes | FK to `media_library.id` |
| `scene_id` | uuid | - | Yes | FK to `scenes.id` |
| `text_content` | text | - | Yes | Text/quote/note content |
| `settings` | jsonb | - | Yes | Block-specific settings |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |

**Foreign Keys**: `page_id` -> `story_pages.id` (CASCADE), `media_id` -> `media_library.id`, `scene_id` -> `scenes.id`.

---

### reflection_questions

> [!NOTE]
> Qualitative reflection questions within a page block. Only supports `open_text` type.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `block_id` | uuid | - | No | FK to `page_blocks.id` (CASCADE) |
| `question_text` | text | - | No | Question text |
| `question_type` | `reflection_question_type` | `'open_text'` | No | Always `open_text` |
| `sequence_number` | integer | - | No | Display order |
| `created_at` | timestamp | `now()` | No | Creation timestamp |

**Foreign Keys**: `block_id` -> `page_blocks.id` (CASCADE).

---

### survey_questions

> [!NOTE]
> Survey questions within a page block. Supports open text, multiple choice, scale, and emotion types.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `block_id` | uuid | - | No | FK to `page_blocks.id` (CASCADE) |
| `question_text` | text | - | No | Question text |
| `question_type` | `survey_question_type` | - | No | `open_text`, `multiple_choice`, `scale`, `emotion` |
| `scale_min` | integer | - | Yes | Scale minimum (for `scale` type) |
| `scale_max` | integer | - | Yes | Scale maximum (for `scale` type) |
| `scale_min_label` | varchar(100) | - | Yes | Label for minimum (e.g., "Not at all") |
| `scale_max_label` | varchar(100) | - | Yes | Label for maximum (e.g., "Extremely") |
| `options` | jsonb | - | Yes | Array of options (for `multiple_choice`) |
| `sequence_number` | integer | - | No | Display order |
| `created_at` | timestamp | `now()` | No | Creation timestamp |

**Foreign Keys**: `block_id` -> `page_blocks.id` (CASCADE).

---

### reflection_responses

> [!NOTE]
> Patient responses to reflection questions. Free-text answers to open-ended therapeutic questions.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `patient_id` | uuid | - | No | FK to `users.id` |
| `page_id` | uuid | - | No | FK to `story_pages.id` |
| `question_id` | uuid | - | No | FK to `reflection_questions.id` |
| `response_text` | text | - | No | Patient's free-text response |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |

**Foreign Keys**: `patient_id` -> `users.id`, `page_id` -> `story_pages.id`, `question_id` -> `reflection_questions.id`.

---

### survey_responses

> [!NOTE]
> Patient responses to survey questions. Stores text, numeric, or selection values depending on question type.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `patient_id` | uuid | - | No | FK to `users.id` |
| `page_id` | uuid | - | No | FK to `story_pages.id` |
| `question_id` | uuid | - | No | FK to `survey_questions.id` |
| `response_value` | text | - | Yes | Text, emotion, or selection value |
| `response_numeric` | integer | - | Yes | Numeric value for scale responses |
| `created_at` | timestamp | `now()` | No | Creation timestamp |

**Foreign Keys**: `patient_id` -> `users.id`, `page_id` -> `story_pages.id`, `question_id` -> `survey_questions.id`.

---

### patient_page_interactions

> [!NOTE]
> Engagement tracking for patient views of story pages. Tracks view count, first/last view, and completion status.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `patient_id` | uuid | - | No | FK to `users.id` |
| `page_id` | uuid | - | No | FK to `story_pages.id` |
| `first_viewed_at` | timestamp | - | Yes | First view timestamp |
| `last_viewed_at` | timestamp | - | Yes | Most recent view timestamp |
| `view_count` | integer | `0` | Yes | Total view count |
| `reflection_completed` | boolean | `false` | Yes | All reflections answered |
| `survey_completed` | boolean | `false` | Yes | All surveys answered |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |

**Foreign Keys**: `patient_id` -> `users.id`, `page_id` -> `story_pages.id`.

---

### recording_links

> [!NOTE]
> Shareable links for mobile audio recording. Therapists generate time-limited links that can be opened on any device to record session audio.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `token` | varchar(64) | - | No | **UNIQUE**; URL token for `/record/[token]` |
| `session_title` | varchar(255) | - | Yes | Pre-filled session title |
| `session_date` | timestamp | - | Yes | Pre-filled session date |
| `patient_ids` | uuid[] | - | Yes | Pre-selected patient IDs |
| `notes` | text | - | Yes | Instructions for recorder |
| `therapist_id` | uuid | - | No | FK to `users.id` |
| `organization_id` | uuid | - | No | FK to `organizations.id` |
| `status` | `recording_link_status` | `'pending'` | No | Link lifecycle status |
| `expires_at` | timestamp | - | No | Expiration timestamp |
| `expiry_duration_minutes` | integer | - | No | Configured expiration duration |
| `access_count` | integer | `0` | No | Number of times accessed |
| `last_accessed_at` | timestamp | - | Yes | Last access timestamp |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |

**Foreign Keys**: `therapist_id` -> `users.id`, `organization_id` -> `organizations.id`.

**Unique Constraints**: `token` is UNIQUE.

---

### uploaded_recordings

> [!NOTE]
> Audio recordings captured via browser (direct) or shareable link. Supports chunked upload with Cloud Run audio merging.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `source` | `recording_source` | - | No | `direct` or `share_link` |
| `recording_link_id` | uuid | - | Yes | FK to `recording_links.id` (SET NULL) |
| `therapist_id` | uuid | - | No | FK to `users.id` |
| `organization_id` | uuid | - | No | FK to `organizations.id` |
| `title` | varchar(255) | - | Yes | Recording title |
| `recorded_at` | timestamp | - | Yes | When recording started |
| `audio_chunks` | jsonb | `[]` | Yes | Array of `{chunkIndex, gcsPath, durationSeconds, sizeBytes, uploadedAt}` |
| `final_audio_url` | text | - | Yes | Merged audio GCS path |
| `total_duration_seconds` | integer | - | Yes | Total duration |
| `total_file_size_bytes` | bigint | - | Yes | Total file size |
| `status` | `uploaded_recording_status` | `'recording'` | No | Recording lifecycle status |
| `session_id` | uuid | - | Yes | FK to `sessions.id` (SET NULL); set when session created |
| `device_info` | jsonb | - | Yes | `{userAgent, platform, browser}` |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |

**Foreign Keys**: `recording_link_id` -> `recording_links.id` (SET NULL), `therapist_id` -> `users.id`, `organization_id` -> `organizations.id`, `session_id` -> `sessions.id` (SET NULL).

**Indexes**: `uploaded_recordings_therapist_id_idx` on `therapist_id`, `uploaded_recordings_status_idx` on `status`, `uploaded_recordings_recording_link_id_idx` on `recording_link_id`.

**JSONB: `audio_chunks`**
```json
[
  {
    "chunkIndex": 0,
    "gcsPath": "recordings/abc/chunk-0.webm",
    "durationSeconds": 30,
    "sizeBytes": 245760,
    "uploadedAt": "2026-01-15T10:30:00Z"
  }
]
```

**JSONB: `device_info`**
```json
{
  "userAgent": "Mozilla/5.0...",
  "platform": "iPhone",
  "browser": "Safari"
}
```

---

### ai_models

> [!NOTE]
> Registry of AI models with pricing, capabilities, and status. Used by the provider abstraction layer and Langfuse tracing for cost tracking. Single-active constraint for transcription models.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `model_id` | varchar(100) | - | No | **UNIQUE**; internal model identifier |
| `display_name` | varchar(255) | - | No | Human-readable name |
| `description` | text | - | Yes | Model description |
| `category` | `model_category` | - | No | `text_to_image`, `image_to_video`, `transcription`, etc. |
| `provider` | varchar(100) | - | No | Provider name (e.g., `openai`, `vertex-ai`) |
| `provider_group` | varchar(100) | - | Yes | Provider grouping for UI |
| `status` | `model_status` | `'active'` | No | `active`, `hidden`, `deprecated`, `disabled` |
| `sort_order` | integer | `0` | No | Display ordering |
| `cost_per_unit` | decimal(10,6) | - | Yes | Cost per pricing unit |
| `pricing_unit` | `pricing_unit` | - | Yes | `per_image`, `per_second`, `per_minute`, etc. |
| `capabilities` | jsonb | `{}` | Yes | Feature flags and limits |
| `api_model_id` | varchar(255) | - | Yes | Provider's model identifier |
| `api_provider` | varchar(100) | - | Yes | Provider's API endpoint identifier |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |

**Unique Constraints**: `model_id` is UNIQUE.

**Indexes**: `ai_models_category_idx` on `category`, `ai_models_status_idx` on `status`, `ai_models_provider_idx` on `provider`.

**JSONB: `capabilities`**
```json
{
  "supportsReference": true,
  "maxReferenceImages": 4,
  "supportsPrompt": true,
  "maxOutputDuration": 10,
  "maxResolution": "1920x1080"
}
```

---

### assessment_instruments

> [!NOTE]
> Clinical assessment instruments (e.g., PCL-5, PHQ-9). Defines scale configuration, scoring methods, subscales, and clinical cutoff thresholds.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `name` | varchar(50) | - | No | Short name (e.g., `PCL-5`) |
| `full_name` | varchar(255) | - | No | Full name (e.g., `PTSD Checklist for DSM-5`) |
| `instrument_type` | `instrument_type` | - | No | `ptsd`, `depression`, `anxiety`, etc. |
| `description` | text | - | Yes | Instrument description |
| `instructions` | text | - | Yes | Administration instructions |
| `scale_min` | integer | `0` | No | Default scale minimum |
| `scale_max` | integer | `4` | No | Default scale maximum |
| `scale_labels` | jsonb | - | Yes | `{"0": "Not at all", "4": "Extremely"}` |
| `scoring_method` | varchar(50) | `'sum'` | No | `sum`, `average`, etc. |
| `total_score_range` | jsonb | - | Yes | `{"min": 0, "max": 80}` |
| `subscales` | jsonb | - | Yes | `[{"name": "Cluster B", "items": [1,2,3,4,5]}]` |
| `clinical_cutoffs` | jsonb | - | Yes | `[{"min": 0, "max": 7, "label": "Normal"}]` |
| `item_count` | integer | `0` | No | Number of items |
| `status` | `instrument_status` | `'active'` | No | `active` or `inactive` |
| `created_by` | uuid | - | Yes | FK to `users.id` |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |

**Foreign Keys**: `created_by` -> `users.id`.

---

### assessment_instrument_items

> [!NOTE]
> Individual items (questions) within an assessment instrument. Supports per-item scale overrides and subscale assignment.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `instrument_id` | uuid | - | No | FK to `assessment_instruments.id` (CASCADE) |
| `item_number` | integer | - | No | Item order number |
| `question_text` | text | - | No | Item question text |
| `item_type` | `assessment_item_type` | `'likert'` | No | `likert`, `multi_choice`, `open_text`, `select`, `number`, `date` |
| `scale_min` | integer | - | Yes | Per-item scale override |
| `scale_max` | integer | - | Yes | Per-item scale override |
| `scale_labels` | jsonb | - | Yes | Per-item label override |
| `options` | jsonb | - | Yes | For multi_choice/select items |
| `is_reverse_scored` | boolean | `false` | No | Reverse scoring flag |
| `subscale_name` | varchar(100) | - | Yes | Subscale assignment |
| `is_required` | boolean | `true` | No | Whether item is required |
| `created_at` | timestamp | `now()` | No | Creation timestamp |

**Foreign Keys**: `instrument_id` -> `assessment_instruments.id` (CASCADE).

**Indexes**: `assessment_items_instrument_idx` on `instrument_id`, `assessment_items_number_idx` on (`instrument_id`, `item_number`).

---

### assessment_sessions

> [!NOTE]
> Individual administration sessions of an assessment instrument to a patient. Tracks scoring, progress, and optional link to therapy sessions.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `patient_id` | uuid | - | No | FK to `users.id` |
| `therapist_id` | uuid | - | No | FK to `users.id` |
| `organization_id` | uuid | - | No | FK to `organizations.id` |
| `instrument_id` | uuid | - | No | FK to `assessment_instruments.id` |
| `timepoint` | `assessment_timepoint` | - | No | `screening`, `baseline`, `mid_treatment`, etc. |
| `status` | `assessment_session_status` | `'in_progress'` | No | `in_progress`, `completed`, `abandoned` |
| `total_score` | decimal(10,2) | - | Yes | Computed total score |
| `subscale_scores` | jsonb | - | Yes | `{"Cluster B": 12, "Cluster C": 5}` |
| `percent_complete` | integer | `0` | No | Completion percentage 0-100 |
| `last_item_number` | integer | `0` | Yes | Last answered item |
| `session_id` | uuid | - | Yes | FK to `sessions.id` (optional therapy session link) |
| `clinician_notes` | text | - | Yes | Therapist notes |
| `completed_at` | timestamp | - | Yes | Completion timestamp |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |

**Foreign Keys**: `patient_id` -> `users.id`, `therapist_id` -> `users.id`, `organization_id` -> `organizations.id`, `instrument_id` -> `assessment_instruments.id`, `session_id` -> `sessions.id`.

**Indexes**: `assessment_sessions_patient_idx` on `patient_id`, `assessment_sessions_therapist_idx` on `therapist_id`, `assessment_sessions_org_idx` on `organization_id`, `assessment_sessions_instrument_idx` on `instrument_id`, `assessment_sessions_status_idx` on `status`.

---

### assessment_responses

> [!NOTE]
> Individual item responses within an assessment session. Stores raw and scored values.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `session_id` | uuid | - | No | FK to `assessment_sessions.id` (CASCADE) |
| `item_id` | uuid | - | No | FK to `assessment_instrument_items.id` |
| `response_numeric` | integer | - | Yes | Numeric response value |
| `response_text` | text | - | Yes | Free-text response |
| `response_value` | varchar(255) | - | Yes | Selection/option value |
| `scored_value` | decimal(10,2) | - | Yes | Final scored value (after reverse scoring) |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |

**Foreign Keys**: `session_id` -> `assessment_sessions.id` (CASCADE), `item_id` -> `assessment_instrument_items.id`.

**Unique Constraints**: `assessment_response_session_item` on (`session_id`, `item_id`).

**Indexes**: `assessment_responses_session_idx` on `session_id`.

---

### video_processing_jobs

> [!NOTE]
> Async video processing jobs (scene assembly, video generation, transcoding, frame extraction, audio merging) executed on Google Cloud Run.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `job_type` | `job_type` | - | No | `scene_assembly`, `video_generation`, `transcoding`, `extract_frame`, `merge_audio_chunks` |
| `status` | `job_status` | `'pending'` | No | `pending`, `processing`, `completed`, `failed` |
| `scene_id` | uuid | - | Yes | FK to `scenes.id` (CASCADE) |
| `media_id` | uuid | - | Yes | FK to `media_library.id` (SET NULL) |
| `progress` | integer | `0` | No | Progress 0-100 |
| `current_step` | varchar(255) | - | Yes | Human-readable step description |
| `input_data` | jsonb | - | Yes | Clips, audio tracks, settings |
| `output_url` | text | - | Yes | Final video URL in GCS |
| `thumbnail_url` | text | - | Yes | Generated thumbnail |
| `error_message` | text | - | Yes | Error details |
| `retry_count` | integer | `0` | No | Number of retries |
| `max_retries` | integer | `3` | No | Maximum retry attempts |
| `cloud_run_job_id` | varchar(255) | - | Yes | Cloud Run execution ID |
| `cloud_run_log_url` | text | - | Yes | Cloud Run log URL |
| `started_at` | timestamp | - | Yes | Job start time |
| `completed_at` | timestamp | - | Yes | Job end time |
| `duration_seconds` | integer | - | Yes | Job execution duration |
| `created_by_user_id` | uuid | - | Yes | FK to `users.id` |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |

**Foreign Keys**: `scene_id` -> `scenes.id` (CASCADE), `media_id` -> `media_library.id` (SET NULL), `created_by_user_id` -> `users.id`.

---

### video_transcoding_jobs

> [!NOTE]
> GPU transcoding jobs on Google Cloud Run. Converts video formats (H.264, H.265, VP9, AV1) with configurable quality and resolution.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `user_id` | uuid | - | No | FK to `users.id` |
| `organization_id` | uuid | - | No | FK to `organizations.id` |
| `execution_name` | varchar(255) | - | Yes | Cloud Run execution ID |
| `status` | `transcoding_job_status` | `'pending'` | No | Job status |
| `input_filename` | varchar(500) | - | No | Input file name |
| `output_filename` | varchar(500) | - | No | Output file name |
| `input_gcs_path` | text | - | No | GCS input path |
| `output_gcs_path` | text | - | Yes | GCS output path |
| `format` | `transcoding_format` | `'h264'` | No | Target format |
| `quality` | `transcoding_quality` | `'high'` | No | Target quality |
| `width` | integer | - | Yes | Target width in pixels |
| `height` | integer | - | Yes | Target height in pixels |
| `fps` | integer | - | Yes | Target frames per second |
| `custom_args` | jsonb | - | Yes | Custom FFmpeg arguments |
| `started_at` | timestamp | - | Yes | Job start time |
| `completed_at` | timestamp | - | Yes | Job end time |
| `error_message` | text | - | Yes | Error details |
| `estimated_cost_usd` | decimal(10,4) | - | Yes | Estimated cost |
| `duration_seconds` | integer | - | Yes | Job duration |
| `input_file_size_bytes` | bigint | - | Yes | Input file size |
| `output_file_size_bytes` | bigint | - | Yes | Output file size |
| `metadata` | jsonb | - | Yes | Additional metadata |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |

**Foreign Keys**: `user_id` -> `users.id`, `organization_id` -> `organizations.id`.

---

### audit_logs

> [!NOTE]
> HIPAA-compliant audit trail. Logs all user actions on resources with request context. Required for 7-year retention.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `user_id` | uuid | - | No | FK to `users.id` |
| `organization_id` | uuid | - | Yes | FK to `organizations.id` (SET NULL) |
| `action` | `audit_action` | - | No | `create`, `read`, `update`, `delete`, `export`, `auth_success`, `auth_failed`, `logout` |
| `resource_type` | varchar(50) | - | No | `session`, `patient`, `media`, etc. |
| `resource_id` | text | - | Yes | ID of accessed resource |
| `ip_address` | varchar(45) | - | Yes | Client IP (IPv6 max length) |
| `user_agent` | text | - | Yes | Browser user agent |
| `request_method` | varchar(10) | - | Yes | HTTP method |
| `request_path` | text | - | Yes | Request URL path |
| `metadata` | jsonb | - | Yes | Additional context (old/new values) |
| `timestamp` | timestamp | `now()` | No | Event timestamp |

**Foreign Keys**: `user_id` -> `users.id`, `organization_id` -> `organizations.id` (SET NULL).

---

### platform_settings

> [!NOTE]
> Global platform configuration managed by super admins. Single-row table for platform-wide settings including AI defaults, storage quotas, security, and email configuration.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `platform_name` | varchar(255) | `'StoryCare'` | No | Platform display name |
| `support_email` | varchar(255) | - | No | Support email address |
| `default_ai_credits` | integer | `1000` | No | Default AI credits per org |
| `image_gen_model` | varchar(50) | `'dall-e-3'` | No | Default image generation model |
| `default_storage_quota` | bigint | `10737418240` | No | Default storage quota (10GB in bytes) |
| `max_file_upload_size` | bigint | `524288000` | No | Max upload size (500MB in bytes) |
| `require_email_verification` | boolean | `true` | No | Email verification required |
| `enable_mfa_for_admins` | boolean | `true` | No | MFA required for admins |
| `session_timeout` | integer | `15` | No | Session timeout in minutes |
| `email_from_name` | varchar(100) | `'StoryCare'` | No | Email sender name |
| `email_from_address` | varchar(255) | `'notifications@storycare.health'` | No | Email sender address |
| `email_footer_text` | text | See default | No | Email footer text |
| `smtp_provider` | varchar(50) | `'sendgrid'` | No | SMTP provider (note: actual provider is Paubox) |
| `enable_email_notifications` | boolean | `true` | No | Global email toggle |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |
| `updated_by` | uuid | - | Yes | FK to `users.id` |

**Foreign Keys**: `updated_by` -> `users.id`.

---

### feature_toggles

> [!NOTE]
> Feature flag system for progressive rollout and A/B testing. Super admins can enable/disable features without code deployment.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | No | Primary key |
| `key` | varchar(100) | - | No | **UNIQUE**; feature identifier |
| `label` | varchar(255) | - | No | Human-readable name |
| `description` | text | - | Yes | Feature description |
| `enabled` | boolean | `false` | No | Whether feature is enabled |
| `created_at` | timestamp | `now()` | No | Creation timestamp |
| `updated_at` | timestamp | `now()` | No | Last update timestamp |

**Unique Constraints**: `key` is UNIQUE.

---

*Last updated: 2026-02-19*
