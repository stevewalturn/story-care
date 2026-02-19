# Entity Relationship Diagram Overview

> [!NOTE]
> This document provides visual ERD diagrams and relationship tables for all 48 database tables in StoryCare, organized by domain. All schema definitions live in a single file: `src/models/Schema.ts`.

---

## Quick Stats

| Metric | Count |
|---|---|
| Total Tables | 48 |
| Enum Types | 38 |
| JSONB Columns | 25+ |
| Tables with Soft Delete | 5 (users, patient_reference_images, transcripts, sessions, media_library) |
| Tables with Indexes | 8 |
| Unique Constraints | 10+ |
| Foreign Key Relationships | 90+ |

---

## Domain Navigator

| Domain | Tables | Description |
|---|---|---|
| [Users & Organizations](#users--organizations) | organizations, users, patient_reference_images, groups, group_members, therapist_patient_archives | Multi-tenant user management |
| [Sessions & Transcription](#sessions--transcription) | sessions, transcripts, speakers, utterances | Therapy session audio processing |
| [AI Chat](#ai-chat) | ai_chat_messages | Session-scoped AI conversations |
| [Media & Assets](#media--assets) | media_library, music_generation_tasks, quotes, notes | Generated and uploaded media |
| [Templates & Modules](#templates--modules) | treatment_modules, module_ai_prompts, module_prompt_links, user_prompt_order, session_modules, survey_templates, reflection_templates, therapeutic_prompts, workflow_executions | Therapeutic content library |
| [Email](#email) | email_notifications | HIPAA-compliant email delivery |
| [Scenes & Video](#scenes--video) | scenes, scene_clips, scene_audio_tracks, video_processing_jobs, video_transcoding_jobs | Video composition and processing |
| [Story Pages](#story-pages) | story_pages, page_share_links, page_blocks, reflection_questions, survey_questions, reflection_responses, survey_responses, patient_page_interactions | Patient-facing content delivery |
| [Recordings](#recordings) | recording_links, uploaded_recordings | Audio recording capture |
| [AI Models](#ai-models) | ai_models | AI model registry and pricing |
| [Clinical Assessments](#clinical-assessments) | assessment_instruments, assessment_instrument_items, assessment_sessions, assessment_responses | Validated clinical instruments |
| [Platform](#platform) | platform_settings, audit_logs, feature_toggles | Platform configuration and compliance |

---

## Users & Organizations

```mermaid
erDiagram
    organizations {
        uuid id PK
        varchar name
        varchar slug UK
        varchar contact_email
        text logo_url
        varchar primary_color
        jsonb settings
        enum status
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
    }

    users {
        uuid id PK
        varchar email UK
        varchar name
        enum role
        uuid organization_id FK
        enum status
        text avatar_url
        varchar license_number
        text specialty
        uuid therapist_id FK
        date date_of_birth
        varchar firebase_uid UK
        varchar invitation_token UK
        varchar password_reset_token UK
        timestamp deleted_at
    }

    patient_reference_images {
        uuid id PK
        uuid patient_id FK
        text image_url
        varchar label
        boolean is_primary
        uuid uploaded_by FK
        timestamp deleted_at
    }

    groups {
        uuid id PK
        varchar name
        text description
        uuid organization_id FK
        uuid therapist_id FK
        timestamp archived_at
    }

    group_members {
        uuid id PK
        uuid group_id FK
        uuid patient_id FK
        timestamp joined_at
        timestamp left_at
    }

    therapist_patient_archives {
        uuid id PK
        uuid therapist_id FK
        uuid patient_id FK
        timestamp archived_at
    }

    organizations ||--o{ users : "has members"
    users ||--o{ users : "therapist has patients"
    users ||--o{ patient_reference_images : "has reference images"
    organizations ||--o{ groups : "has groups"
    users ||--o{ groups : "therapist owns"
    groups ||--o{ group_members : "has members"
    users ||--o{ group_members : "patient belongs to"
    users ||--o{ therapist_patient_archives : "therapist archives"
    users ||--o{ therapist_patient_archives : "patient archived by"
```

### Relationships

| Parent | Child | Cardinality | FK Column | On Delete |
|---|---|---|---|---|
| organizations | users | 1:N | `organization_id` | RESTRICT |
| users (therapist) | users (patient) | 1:N | `therapist_id` | - |
| users | patient_reference_images | 1:N | `patient_id` | CASCADE |
| users | patient_reference_images | N:1 | `uploaded_by` | - |
| organizations | groups | 1:N | `organization_id` | CASCADE |
| users | groups | 1:N | `therapist_id` | - |
| groups | group_members | 1:N | `group_id` | CASCADE |
| users | group_members | 1:N | `patient_id` | CASCADE |
| users | therapist_patient_archives | 1:N | `therapist_id` | CASCADE |
| users | therapist_patient_archives | 1:N | `patient_id` | CASCADE |

---

## Sessions & Transcription

```mermaid
erDiagram
    sessions {
        uuid id PK
        varchar title
        date session_date
        enum session_type
        uuid therapist_id FK
        uuid patient_id FK
        uuid group_id FK
        text audio_url
        integer audio_duration_seconds
        enum transcription_status
        uuid module_id
        text session_summary
        boolean speakers_setup_completed
        timestamp archived_at
        timestamp deleted_at
    }

    transcripts {
        uuid id PK
        uuid session_id FK_UK
        text full_text
        decimal confidence_score
        varchar language_code
        timestamp deleted_at
    }

    speakers {
        uuid id PK
        uuid transcript_id FK
        varchar speaker_label
        enum speaker_type
        varchar speaker_name
        uuid user_id FK
        integer total_utterances
        integer total_duration_seconds
    }

    utterances {
        uuid id PK
        uuid transcript_id FK
        uuid speaker_id FK
        text text
        decimal start_time_seconds
        decimal end_time_seconds
        decimal confidence_score
        integer sequence_number
    }

    sessions ||--o| transcripts : "has transcript"
    transcripts ||--o{ speakers : "has speakers"
    transcripts ||--o{ utterances : "has utterances"
    speakers ||--o{ utterances : "spoken by"
    users ||--o{ sessions : "therapist manages"
    users ||--o{ sessions : "patient attends"
    groups ||--o{ sessions : "group session"
```

### Relationships

| Parent | Child | Cardinality | FK Column | On Delete |
|---|---|---|---|---|
| users (therapist) | sessions | 1:N | `therapist_id` | - |
| users (patient) | sessions | 1:N | `patient_id` | - |
| groups | sessions | 1:N | `group_id` | - |
| sessions | transcripts | 1:1 | `session_id` (unique) | CASCADE |
| transcripts | speakers | 1:N | `transcript_id` | CASCADE |
| transcripts | utterances | 1:N | `transcript_id` | CASCADE |
| speakers | utterances | 1:N | `speaker_id` | CASCADE |
| users | speakers | 1:N | `user_id` | - |

---

## AI Chat

```mermaid
erDiagram
    ai_chat_messages {
        uuid id PK
        uuid session_id FK
        uuid therapist_id FK
        enum role
        text content
        varchar ai_model
        text selected_text
        uuid_array selected_utterance_ids
        uuid generated_media_id
        varchar prompt_type
        uuid summary_up_to_message_id
        varchar message_type
        jsonb json_data
        varchar action_status
        timestamp created_at
    }

    sessions ||--o{ ai_chat_messages : "has chat messages"
    users ||--o{ ai_chat_messages : "therapist chats"
```

### Relationships

| Parent | Child | Cardinality | FK Column | On Delete |
|---|---|---|---|---|
| sessions | ai_chat_messages | 1:N | `session_id` | CASCADE |
| users | ai_chat_messages | 1:N | `therapist_id` | - |

---

## Media & Assets

```mermaid
erDiagram
    media_library {
        uuid id PK
        uuid patient_id FK
        uuid created_by_therapist_id FK
        varchar title
        text description
        text notes
        enum media_type
        text media_url
        text thumbnail_url
        bigint file_size_bytes
        integer duration_seconds
        enum source_type
        uuid source_session_id FK
        uuid source_media_id FK
        uuid scene_id
        text generation_prompt
        varchar ai_model
        jsonb generation_metadata
        uuid chat_message_id
        text_array tags
        enum status
        timestamp deleted_at
    }

    music_generation_tasks {
        uuid id PK
        varchar task_id UK
        varchar suno_task_id
        enum status
        integer progress
        text prompt
        varchar style
        varchar model
        boolean custom_mode
        boolean instrumental
        uuid media_id FK
        text audio_url
        uuid patient_id FK
        uuid session_id FK
        uuid created_by_therapist_id FK
        timestamp dismissed_at
    }

    quotes {
        uuid id PK
        uuid patient_id FK
        uuid session_id FK
        text quote_text
        uuid speaker_id FK
        decimal start_time_seconds
        decimal end_time_seconds
        text_array tags
        text notes
        uuid created_by_therapist_id FK
    }

    notes {
        uuid id PK
        uuid patient_id FK
        uuid therapist_id FK
        varchar title
        text content
        uuid session_id FK
        text_array tags
    }

    users ||--o{ media_library : "patient owns"
    users ||--o{ media_library : "therapist creates"
    sessions ||--o{ media_library : "source session"
    media_library ||--o{ media_library : "derived from"
    media_library ||--o{ music_generation_tasks : "result media"
    users ||--o{ quotes : "patient quoted"
    sessions ||--o{ quotes : "from session"
    speakers ||--o{ quotes : "spoken by"
    users ||--o{ notes : "patient subject"
    users ||--o{ notes : "therapist writes"
```

### Relationships

| Parent | Child | Cardinality | FK Column | On Delete |
|---|---|---|---|---|
| users (patient) | media_library | 1:N | `patient_id` | - |
| users (therapist) | media_library | 1:N | `created_by_therapist_id` | - |
| sessions | media_library | 1:N | `source_session_id` | - |
| media_library | media_library | 1:N (self) | `source_media_id` | - |
| media_library | music_generation_tasks | 1:1 | `media_id` | - |
| users | music_generation_tasks | 1:N | `patient_id` | - |
| users | music_generation_tasks | 1:N | `created_by_therapist_id` | - |
| sessions | music_generation_tasks | 1:N | `session_id` | - |
| users | quotes | 1:N | `patient_id` | - |
| sessions | quotes | 1:N | `session_id` | - |
| speakers | quotes | 1:N | `speaker_id` | - |
| users | quotes | 1:N | `created_by_therapist_id` | - |
| users | notes | 1:N | `patient_id` | - |
| users | notes | 1:N | `therapist_id` | - |
| sessions | notes | 1:N | `session_id` | - |

---

## Templates & Modules

```mermaid
erDiagram
    treatment_modules {
        uuid id PK
        varchar name
        enum domain
        text description
        enum scope
        uuid organization_id FK
        uuid created_by FK
        text ai_prompt_text
        jsonb ai_prompt_metadata
        integer use_count
        enum status
    }

    module_ai_prompts {
        uuid id PK
        varchar name
        text prompt_text
        text system_prompt
        text user_prompt
        text description
        varchar category
        varchar icon
        varchar output_type
        jsonb json_schema
        jsonb blocks
        boolean use_advanced_mode
        enum scope
        uuid organization_id FK
        uuid created_by FK
        integer use_count
        boolean is_active
    }

    module_prompt_links {
        uuid id PK
        uuid module_id FK
        uuid prompt_id FK
        integer sort_order
    }

    user_prompt_order {
        uuid id PK
        uuid user_id FK
        uuid prompt_id FK
        integer sort_order
    }

    session_modules {
        uuid id PK
        uuid session_id FK
        uuid module_id FK
        uuid assigned_by FK
        boolean ai_analysis_completed
        jsonb ai_analysis_result
        uuid story_page_id FK
        text notes
    }

    workflow_executions {
        uuid id PK
        uuid prompt_id FK
        jsonb blocks
        jsonb context
        varchar status
        integer current_step_index
        uuid session_id FK
        uuid patient_id FK
        uuid therapist_id FK
        uuid organization_id FK
    }

    survey_templates {
        uuid id PK
        enum scope
        uuid organization_id FK
        uuid created_by FK
        enum status
        varchar title
        text description
        enum category
        jsonb questions
        integer use_count
    }

    reflection_templates {
        uuid id PK
        enum scope
        uuid organization_id FK
        uuid created_by FK
        enum status
        varchar title
        text description
        enum category
        jsonb questions
        integer use_count
    }

    therapeutic_prompts {
        uuid id PK
        enum scope
        uuid organization_id FK
        uuid created_by FK
        enum status
        varchar title
        text prompt_text
        varchar category
        text_array tags
        boolean is_favorite
        integer use_count
    }

    treatment_modules ||--o{ module_prompt_links : "has prompts"
    module_ai_prompts ||--o{ module_prompt_links : "linked to modules"
    module_ai_prompts ||--o{ user_prompt_order : "user ordering"
    module_ai_prompts ||--o{ workflow_executions : "executions"
    sessions ||--o{ session_modules : "assigned modules"
    treatment_modules ||--o{ session_modules : "module used"
```

### Relationships

| Parent | Child | Cardinality | FK Column | On Delete |
|---|---|---|---|---|
| treatment_modules | module_prompt_links | 1:N | `module_id` | CASCADE |
| module_ai_prompts | module_prompt_links | 1:N | `prompt_id` | CASCADE |
| users | user_prompt_order | 1:N | `user_id` | CASCADE |
| module_ai_prompts | user_prompt_order | 1:N | `prompt_id` | CASCADE |
| sessions | session_modules | 1:N | `session_id` | CASCADE |
| treatment_modules | session_modules | 1:N | `module_id` | SET NULL |
| users | session_modules | N:1 | `assigned_by` | - |
| story_pages | session_modules | 1:1 | `story_page_id` | - |
| module_ai_prompts | workflow_executions | 1:N | `prompt_id` | CASCADE |
| sessions | workflow_executions | 1:N | `session_id` | CASCADE |
| users | workflow_executions | 1:N | `patient_id` | CASCADE |
| users | workflow_executions | 1:N | `therapist_id` | CASCADE |
| organizations | workflow_executions | 1:N | `organization_id` | CASCADE |
| organizations | survey_templates | 1:N | `organization_id` | CASCADE |
| users | survey_templates | 1:N | `created_by` | - |
| organizations | reflection_templates | 1:N | `organization_id` | CASCADE |
| users | reflection_templates | 1:N | `created_by` | - |
| organizations | therapeutic_prompts | 1:N | `organization_id` | CASCADE |
| users | therapeutic_prompts | 1:N | `created_by` | - |

---

## Email

```mermaid
erDiagram
    email_notifications {
        uuid id PK
        enum notification_type
        uuid recipient_user_id FK
        varchar recipient_email
        varchar subject
        text body_text
        text body_html
        uuid story_page_id FK
        uuid session_id FK
        uuid module_id FK
        enum status
        timestamp sent_at
        varchar external_id
    }

    users ||--o{ email_notifications : "receives"
    story_pages ||--o{ email_notifications : "about page"
    sessions ||--o{ email_notifications : "about session"
    treatment_modules ||--o{ email_notifications : "about module"
```

### Relationships

| Parent | Child | Cardinality | FK Column | On Delete |
|---|---|---|---|---|
| users | email_notifications | 1:N | `recipient_user_id` | - |
| story_pages | email_notifications | 1:N | `story_page_id` | - |
| sessions | email_notifications | 1:N | `session_id` | - |
| treatment_modules | email_notifications | 1:N | `module_id` | - |

---

## Scenes & Video

```mermaid
erDiagram
    scenes {
        uuid id PK
        uuid patient_id FK
        uuid created_by_therapist_id FK
        varchar title
        text description
        text video_url
        text assembled_video_url
        text thumbnail_url
        varchar duration_seconds
        text background_audio_url
        boolean loop_audio
        boolean loop_scenes
        boolean fit_audio_to_duration
        enum status
        text processing_error
    }

    scene_clips {
        uuid id PK
        uuid scene_id FK
        uuid media_id FK
        integer sequence_number
        decimal start_time_seconds
        decimal end_time_seconds
    }

    scene_audio_tracks {
        uuid id PK
        uuid scene_id FK
        uuid audio_id FK
        text audio_url
        varchar title
        decimal start_time_seconds
        decimal duration_seconds
        integer volume
        integer sequence_number
    }

    video_processing_jobs {
        uuid id PK
        enum job_type
        enum status
        uuid scene_id FK
        uuid media_id FK
        integer progress
        varchar current_step
        jsonb input_data
        text output_url
        varchar cloud_run_job_id
        uuid created_by_user_id FK
    }

    video_transcoding_jobs {
        uuid id PK
        uuid user_id FK
        uuid organization_id FK
        varchar execution_name
        enum status
        varchar input_filename
        varchar output_filename
        text input_gcs_path
        text output_gcs_path
        enum format
        enum quality
        jsonb custom_args
        decimal estimated_cost_usd
    }

    scenes ||--o{ scene_clips : "has clips"
    scenes ||--o{ scene_audio_tracks : "has audio tracks"
    scenes ||--o{ video_processing_jobs : "processing jobs"
    media_library ||--o{ scene_clips : "clip source"
    media_library ||--o{ scene_audio_tracks : "audio source"
    media_library ||--o{ video_processing_jobs : "output media"
```

### Relationships

| Parent | Child | Cardinality | FK Column | On Delete |
|---|---|---|---|---|
| users (patient) | scenes | 1:N | `patient_id` | - |
| users (therapist) | scenes | 1:N | `created_by_therapist_id` | - |
| scenes | scene_clips | 1:N | `scene_id` | CASCADE |
| media_library | scene_clips | 1:N | `media_id` | - |
| scenes | scene_audio_tracks | 1:N | `scene_id` | CASCADE |
| media_library | scene_audio_tracks | 1:N | `audio_id` | - |
| scenes | video_processing_jobs | 1:N | `scene_id` | CASCADE |
| media_library | video_processing_jobs | 1:N | `media_id` | SET NULL |
| users | video_processing_jobs | 1:N | `created_by_user_id` | - |
| users | video_transcoding_jobs | 1:N | `user_id` | - |
| organizations | video_transcoding_jobs | 1:N | `organization_id` | - |

---

## Story Pages

```mermaid
erDiagram
    story_pages {
        uuid id PK
        uuid patient_id FK
        uuid created_by_therapist_id FK
        varchar title
        text description
        enum status
        enum visibility
        timestamp published_at
        varchar share_token UK
        boolean is_shareable
        uuid module_id
        boolean auto_generated
        enum generation_source
    }

    page_share_links {
        uuid id PK
        uuid page_id FK
        varchar token UK
        timestamp expires_at
        integer expiry_duration_minutes
        uuid created_by_therapist_id FK
        boolean is_active
        integer access_count
    }

    page_blocks {
        uuid id PK
        uuid page_id FK
        enum block_type
        integer sequence_number
        uuid media_id FK
        uuid scene_id FK
        text text_content
        jsonb settings
    }

    reflection_questions {
        uuid id PK
        uuid block_id FK
        text question_text
        enum question_type
        integer sequence_number
    }

    survey_questions {
        uuid id PK
        uuid block_id FK
        text question_text
        enum question_type
        integer scale_min
        integer scale_max
        jsonb options
        integer sequence_number
    }

    reflection_responses {
        uuid id PK
        uuid patient_id FK
        uuid page_id FK
        uuid question_id FK
        text response_text
    }

    survey_responses {
        uuid id PK
        uuid patient_id FK
        uuid page_id FK
        uuid question_id FK
        text response_value
        integer response_numeric
    }

    patient_page_interactions {
        uuid id PK
        uuid patient_id FK
        uuid page_id FK
        timestamp first_viewed_at
        timestamp last_viewed_at
        integer view_count
        boolean reflection_completed
        boolean survey_completed
    }

    story_pages ||--o{ page_share_links : "share links"
    story_pages ||--o{ page_blocks : "has blocks"
    page_blocks ||--o{ reflection_questions : "has reflections"
    page_blocks ||--o{ survey_questions : "has surveys"
    reflection_questions ||--o{ reflection_responses : "has responses"
    survey_questions ||--o{ survey_responses : "has responses"
    story_pages ||--o{ patient_page_interactions : "tracked interactions"
    story_pages ||--o{ reflection_responses : "page responses"
    story_pages ||--o{ survey_responses : "page responses"
```

### Relationships

| Parent | Child | Cardinality | FK Column | On Delete |
|---|---|---|---|---|
| users (patient) | story_pages | 1:N | `patient_id` | - |
| users (therapist) | story_pages | 1:N | `created_by_therapist_id` | - |
| story_pages | page_share_links | 1:N | `page_id` | CASCADE |
| users | page_share_links | 1:N | `created_by_therapist_id` | - |
| story_pages | page_blocks | 1:N | `page_id` | CASCADE |
| media_library | page_blocks | 1:N | `media_id` | - |
| scenes | page_blocks | 1:N | `scene_id` | - |
| page_blocks | reflection_questions | 1:N | `block_id` | CASCADE |
| page_blocks | survey_questions | 1:N | `block_id` | CASCADE |
| users | reflection_responses | 1:N | `patient_id` | - |
| story_pages | reflection_responses | 1:N | `page_id` | - |
| reflection_questions | reflection_responses | 1:N | `question_id` | - |
| users | survey_responses | 1:N | `patient_id` | - |
| story_pages | survey_responses | 1:N | `page_id` | - |
| survey_questions | survey_responses | 1:N | `question_id` | - |
| users | patient_page_interactions | 1:N | `patient_id` | - |
| story_pages | patient_page_interactions | 1:N | `page_id` | - |

---

## Recordings

```mermaid
erDiagram
    recording_links {
        uuid id PK
        varchar token UK
        varchar session_title
        timestamp session_date
        uuid_array patient_ids
        text notes
        uuid therapist_id FK
        uuid organization_id FK
        enum status
        timestamp expires_at
        integer expiry_duration_minutes
        integer access_count
    }

    uploaded_recordings {
        uuid id PK
        enum source
        uuid recording_link_id FK
        uuid therapist_id FK
        uuid organization_id FK
        varchar title
        timestamp recorded_at
        jsonb audio_chunks
        text final_audio_url
        integer total_duration_seconds
        enum status
        uuid session_id FK
        jsonb device_info
    }

    recording_links ||--o{ uploaded_recordings : "produces"
    users ||--o{ recording_links : "therapist owns"
    organizations ||--o{ recording_links : "org scoped"
    users ||--o{ uploaded_recordings : "therapist owns"
    sessions ||--o{ uploaded_recordings : "becomes session"
```

### Relationships

| Parent | Child | Cardinality | FK Column | On Delete |
|---|---|---|---|---|
| users | recording_links | 1:N | `therapist_id` | - |
| organizations | recording_links | 1:N | `organization_id` | - |
| recording_links | uploaded_recordings | 1:N | `recording_link_id` | SET NULL |
| users | uploaded_recordings | 1:N | `therapist_id` | - |
| organizations | uploaded_recordings | 1:N | `organization_id` | - |
| sessions | uploaded_recordings | 1:N | `session_id` | SET NULL |

---

## AI Models

```mermaid
erDiagram
    ai_models {
        uuid id PK
        varchar model_id UK
        varchar display_name
        text description
        enum category
        varchar provider
        varchar provider_group
        enum status
        integer sort_order
        decimal cost_per_unit
        enum pricing_unit
        jsonb capabilities
        varchar api_model_id
        varchar api_provider
    }
```

> [!TIP]
> The `ai_models` table is a standalone registry with no foreign key relationships. It stores model metadata, pricing, and capabilities for the provider abstraction layer.

---

## Clinical Assessments

```mermaid
erDiagram
    assessment_instruments {
        uuid id PK
        varchar name
        varchar full_name
        enum instrument_type
        text description
        text instructions
        integer scale_min
        integer scale_max
        jsonb scale_labels
        varchar scoring_method
        jsonb total_score_range
        jsonb subscales
        jsonb clinical_cutoffs
        integer item_count
        enum status
        uuid created_by FK
    }

    assessment_instrument_items {
        uuid id PK
        uuid instrument_id FK
        integer item_number
        text question_text
        enum item_type
        integer scale_min
        integer scale_max
        jsonb scale_labels
        jsonb options
        boolean is_reverse_scored
        varchar subscale_name
        boolean is_required
    }

    assessment_sessions {
        uuid id PK
        uuid patient_id FK
        uuid therapist_id FK
        uuid organization_id FK
        uuid instrument_id FK
        enum timepoint
        enum status
        decimal total_score
        jsonb subscale_scores
        integer percent_complete
        integer last_item_number
        uuid session_id FK
        text clinician_notes
        timestamp completed_at
    }

    assessment_responses {
        uuid id PK
        uuid session_id FK
        uuid item_id FK
        integer response_numeric
        text response_text
        varchar response_value
        decimal scored_value
    }

    assessment_instruments ||--o{ assessment_instrument_items : "has items"
    assessment_instruments ||--o{ assessment_sessions : "administered in"
    assessment_sessions ||--o{ assessment_responses : "has responses"
    assessment_instrument_items ||--o{ assessment_responses : "answered"
    users ||--o{ assessment_sessions : "patient takes"
    users ||--o{ assessment_sessions : "therapist administers"
    organizations ||--o{ assessment_sessions : "org scoped"
```

### Relationships

| Parent | Child | Cardinality | FK Column | On Delete |
|---|---|---|---|---|
| assessment_instruments | assessment_instrument_items | 1:N | `instrument_id` | CASCADE |
| assessment_instruments | assessment_sessions | 1:N | `instrument_id` | - |
| users (patient) | assessment_sessions | 1:N | `patient_id` | - |
| users (therapist) | assessment_sessions | 1:N | `therapist_id` | - |
| organizations | assessment_sessions | 1:N | `organization_id` | - |
| sessions | assessment_sessions | 1:N | `session_id` | - |
| assessment_sessions | assessment_responses | 1:N | `session_id` | CASCADE |
| assessment_instrument_items | assessment_responses | 1:N | `item_id` | - |
| users | assessment_instruments | 1:N | `created_by` | - |

---

## Platform

```mermaid
erDiagram
    platform_settings {
        uuid id PK
        varchar platform_name
        varchar support_email
        integer default_ai_credits
        varchar image_gen_model
        bigint default_storage_quota
        bigint max_file_upload_size
        boolean require_email_verification
        boolean enable_mfa_for_admins
        integer session_timeout
        varchar email_from_name
        varchar email_from_address
        varchar smtp_provider
        boolean enable_email_notifications
        uuid updated_by FK
    }

    audit_logs {
        uuid id PK
        uuid user_id FK
        uuid organization_id FK
        enum action
        varchar resource_type
        text resource_id
        varchar ip_address
        text user_agent
        varchar request_method
        text request_path
        jsonb metadata
        timestamp timestamp
    }

    feature_toggles {
        uuid id PK
        varchar key UK
        varchar label
        text description
        boolean enabled
    }

    users ||--o{ audit_logs : "performed by"
    organizations ||--o{ audit_logs : "org context"
    users ||--o| platform_settings : "updated by"
```

### Relationships

| Parent | Child | Cardinality | FK Column | On Delete |
|---|---|---|---|---|
| users | audit_logs | 1:N | `user_id` | - |
| organizations | audit_logs | 1:N | `organization_id` | SET NULL |
| users | platform_settings | 1:1 | `updated_by` | - |

---

*Last updated: 2026-02-19*
