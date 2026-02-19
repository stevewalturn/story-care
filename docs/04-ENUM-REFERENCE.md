# Enum Reference

> **Source of truth**: `src/models/Schema.ts`
> All enums are defined as PostgreSQL enums via `pgEnum()` from DrizzleORM.
> **Total enums**: 38

---

## Quick Find Index

| Enum | Domain | Values |
|------|--------|--------|
| `assessment_item_type` | Clinical Assessments | 6 |
| `assessment_session_status` | Clinical Assessments | 3 |
| `assessment_timepoint` | Clinical Assessments | 9 |
| `audit_action` | Audit | 8 |
| `block_type` | Content | 9 |
| `chat_role` | Chat | 3 |
| `generation_source` | Modules & Prompts | 3 |
| `instrument_status` | Clinical Assessments | 2 |
| `instrument_type` | Clinical Assessments | 7 |
| `job_status` | Scenes & Video | 4 |
| `job_type` | Scenes & Video | 5 |
| `media_status` | Media | 3 |
| `media_type` | Media | 3 |
| `model_category` | AI Models | 8 |
| `model_status` | AI Models | 4 |
| `module_status` | Modules & Prompts | 3 |
| `music_generation_status` | Music | 4 |
| `notification_status` | Notifications | 6 |
| `notification_type` | Notifications | 7 |
| `organization_status` | User & Organization | 2 |
| `page_status` | Content | 3 |
| `pricing_unit` | AI Models | 5 |
| `priority` | Content | 3 |
| `question_type` | Questions (Legacy) | 4 |
| `recording_link_status` | Recordings | 5 |
| `recording_source` | Recordings | 2 |
| `reflection_question_type` | Questions | 1 |
| `scene_status` | Scenes & Video | 4 |
| `session_type` | Sessions | 2 |
| `source_type` | Media | 6 |
| `speaker_type` | Sessions | 3 |
| `survey_question_type` | Questions | 4 |
| `template_category` | Templates | 7 |
| `template_scope` | Templates | 3 |
| `template_status` | Templates | 4 |
| `therapeutic_domain` | Modules & Prompts | 4 |
| `transcoding_format` | Scenes & Video | 4 |
| `transcoding_job_status` | Scenes & Video | 5 |
| `transcoding_quality` | Scenes & Video | 4 |
| `transcription_status` | Sessions | 4 |
| `uploaded_recording_status` | Recordings | 6 |
| `user_role` | User & Organization | 4 |
| `user_status` | User & Organization | 6 |
| `visibility` | Content | 2 |

---

## User & Organization

### `user_role`

Defines the access level for a user across the platform.

| Value | Description | Used In |
|-------|-------------|---------|
| `super_admin` | Platform-wide administrative access. Manages all organizations. | `users` |
| `org_admin` | Organization-level admin. Manages users and settings within their organization. | `users` |
| `therapist` | Primary user. Uploads sessions, analyzes transcripts, generates media, creates story pages. | `users` |
| `patient` | Secondary user. Views story pages, watches videos, answers reflections and surveys. | `users` |

### `user_status`

Tracks the lifecycle state of a user account.

| Value | Description | Used In |
|-------|-------------|---------|
| `pending_approval` | Awaiting super admin approval before invitation is sent. | `users` |
| `invited` | Pre-created by org admin/super admin, waiting for first sign-in. Auto-activates on login. | `users` |
| `active` | User has signed in and account is fully operational. | `users` |
| `inactive` | Account has been deactivated by an admin. | `users` |
| `rejected` | Super admin rejected the invitation request. | `users` |
| `deleted` | Soft-deleted user for HIPAA compliance. Retained for audit trail. | `users` |

### `organization_status`

Controls whether an organization can operate on the platform.

| Value | Description | Used In |
|-------|-------------|---------|
| `active` | Organization is fully operational. | `organizations` |
| `suspended` | Organization access has been suspended by a super admin. | `organizations` |

---

## Templates

### `template_scope`

Determines the visibility and accessibility of a template, prompt, or module.

| Value | Description | Used In |
|-------|-------------|---------|
| `system` | Platform-wide. Available to all organizations. Managed by super admins. | `survey_templates`, `reflection_templates`, `therapeutic_prompts`, `treatment_modules`, `module_ai_prompts` |
| `organization` | Scoped to a single organization. Visible to all users within that org. | `survey_templates`, `reflection_templates`, `therapeutic_prompts`, `treatment_modules`, `module_ai_prompts` |
| `private` | Visible only to the creator. | `survey_templates`, `reflection_templates`, `therapeutic_prompts`, `treatment_modules`, `module_ai_prompts` |

### `template_status`

Approval workflow state for templates and prompts.

| Value | Description | Used In |
|-------|-------------|---------|
| `active` | Approved and available for use. | `survey_templates`, `reflection_templates`, `therapeutic_prompts` |
| `pending_approval` | Submitted and waiting for admin review. | `survey_templates`, `reflection_templates`, `therapeutic_prompts` |
| `rejected` | Rejected by admin with a reason. | `survey_templates`, `reflection_templates`, `therapeutic_prompts` |
| `archived` | No longer actively used but retained for reference. | `survey_templates`, `reflection_templates`, `therapeutic_prompts` |

### `template_category`

Classification for survey and reflection templates.

| Value | Description | Used In |
|-------|-------------|---------|
| `screening` | Initial assessment or screening questions. | `survey_templates`, `reflection_templates` |
| `outcome` | Outcome measurement templates. | `survey_templates`, `reflection_templates` |
| `satisfaction` | Patient satisfaction surveys. | `survey_templates`, `reflection_templates` |
| `custom` | User-created custom templates. Default value. | `survey_templates`, `reflection_templates` |
| `narrative` | Narrative therapy-specific templates. | `survey_templates`, `reflection_templates` |
| `emotion` | Emotion-focused templates. | `survey_templates`, `reflection_templates` |
| `goal-setting` | Goal-setting and planning templates. | `survey_templates`, `reflection_templates` |

---

## Sessions

### `session_type`

Differentiates between therapy session formats.

| Value | Description | Used In |
|-------|-------------|---------|
| `individual` | One-on-one session between therapist and patient. Links to `patientId`. | `sessions` |
| `group` | Group therapy session. Links to `groupId`. | `sessions` |

### `transcription_status`

Tracks the progress of audio transcription via Deepgram.

| Value | Description | Used In |
|-------|-------------|---------|
| `pending` | Audio uploaded but transcription not yet started. Default value. | `sessions` |
| `processing` | Deepgram is actively transcribing the audio. | `sessions` |
| `completed` | Transcription finished successfully. Transcript available. | `sessions` |
| `failed` | Transcription failed. Error details in `transcriptionError`. | `sessions` |

### `speaker_type`

Identifies the role of a speaker detected via diarization.

| Value | Description | Used In |
|-------|-------------|---------|
| `therapist` | The therapist conducting the session. | `speakers` |
| `patient` | The patient in an individual session. | `speakers` |
| `group_member` | A member of a group therapy session. | `speakers` |

---

## Media

### `media_type`

Categorizes the fundamental type of a media asset.

| Value | Description | Used In |
|-------|-------------|---------|
| `image` | Static image (AI-generated or uploaded). | `media_library` |
| `video` | Video content (AI-generated, scene compilation, or uploaded). | `media_library` |
| `audio` | Audio content (music generation via Suno AI or uploaded). | `media_library` |

### `source_type`

Tracks how a media asset was created or obtained.

| Value | Description | Used In |
|-------|-------------|---------|
| `generated` | AI-generated content (Vertex AI Imagen, Suno, etc.). | `media_library` |
| `uploaded` | Manually uploaded by a therapist. | `media_library` |
| `scene` | Output from a scene assembly/compilation job. | `media_library` |
| `animated_from_image` | Video generated from a static image (image-to-video). | `media_library` |
| `therapist_created` | Manually created content by a therapist (e.g., notes, quotes). | `media_library` |
| `extracted` | Extracted from existing content (e.g., frame from video). | `media_library` |

### `media_status`

Processing state of a media asset.

| Value | Description | Used In |
|-------|-------------|---------|
| `processing` | Media is being generated or processed. | `media_library` |
| `completed` | Media is ready and available. Default value. | `media_library` |
| `failed` | Media generation or processing failed. | `media_library` |

---

## Content

### `block_type`

Defines the type of content block within a story page.

| Value | Description | Used In |
|-------|-------------|---------|
| `video` | Embedded video player. References `mediaId`. | `page_blocks` |
| `image` | Image display. References `mediaId`. | `page_blocks` |
| `audio` | Audio player. References `mediaId`. | `page_blocks` |
| `text` | Rich text content. Stored in `textContent`. | `page_blocks` |
| `quote` | Highlighted quote from a session transcript. | `page_blocks` |
| `note` | Therapist note or annotation. | `page_blocks` |
| `scene` | Embedded scene video. References `sceneId`. | `page_blocks` |
| `reflection` | Open-ended reflection questions for the patient. | `page_blocks` |
| `survey` | Survey with multiple question types. | `page_blocks` |

### `page_status`

Publication lifecycle of a story page.

| Value | Description | Used In |
|-------|-------------|---------|
| `draft` | Page is being edited. Not visible to the patient. Default value. | `story_pages` |
| `published` | Page is visible to the patient. `publishedAt` is set. | `story_pages` |
| `archived` | Page is no longer active but retained for records. | `story_pages` |

### `visibility`

Controls who can see a story page.

| Value | Description | Used In |
|-------|-------------|---------|
| `private` | Only the therapist can view the page. Default value. | `story_pages` |
| `patient_only` | The assigned patient (and therapist) can view the page. | `story_pages` |

### `priority`

General priority level. Currently defined but not widely used in tables.

| Value | Description | Used In |
|-------|-------------|---------|
| `low` | Low priority. | (Available for general use) |
| `medium` | Medium priority. | (Available for general use) |
| `high` | High priority. | (Available for general use) |

---

## Questions

### `reflection_question_type`

Type of reflection question. Reflections are qualitative-only by design.

| Value | Description | Used In |
|-------|-------------|---------|
| `open_text` | Free-form text response. The only supported type for reflections. | `reflection_questions` |

### `survey_question_type`

Type of survey question. Surveys support all response formats.

| Value | Description | Used In |
|-------|-------------|---------|
| `open_text` | Free-form text response. | `survey_questions` |
| `multiple_choice` | Select from predefined options. Options stored in `options` JSONB. | `survey_questions` |
| `scale` | Numeric scale (e.g., 1-10). Configured with `scaleMin`/`scaleMax`. | `survey_questions` |
| `emotion` | Emotion picker response. | `survey_questions` |

### `question_type` (Legacy)

> **Deprecated**: Kept for backward compatibility. Will be removed after migration. Use `reflection_question_type` or `survey_question_type` instead.

| Value | Description | Used In |
|-------|-------------|---------|
| `open_text` | Free-form text response. | (Legacy -- pending removal) |
| `multiple_choice` | Select from predefined options. | (Legacy -- pending removal) |
| `scale` | Numeric scale. | (Legacy -- pending removal) |
| `emotion` | Emotion picker. | (Legacy -- pending removal) |

---

## Scenes & Video

### `scene_status`

State of a video scene composition.

| Value | Description | Used In |
|-------|-------------|---------|
| `draft` | Scene is being assembled. Default value. | `scenes` |
| `processing` | Scene is being compiled into a video by Cloud Run. | `scenes` |
| `completed` | Scene video is ready. `assembledVideoUrl` is set. | `scenes` |
| `failed` | Scene compilation failed. Error in `processingError`. | `scenes` |

### `job_status`

State of an async video processing job.

| Value | Description | Used In |
|-------|-------------|---------|
| `pending` | Job queued but not yet started. Default value. | `video_processing_jobs` |
| `processing` | Job is actively running on Cloud Run. | `video_processing_jobs` |
| `completed` | Job finished successfully. Output available at `outputUrl`. | `video_processing_jobs` |
| `failed` | Job failed. Error in `errorMessage`. May retry up to `maxRetries`. | `video_processing_jobs` |

### `job_type`

Classifies the type of video processing operation.

| Value | Description | Used In |
|-------|-------------|---------|
| `scene_assembly` | Assembling scene clips and audio into a final video. | `video_processing_jobs` |
| `video_generation` | Generating video from AI (e.g., image-to-video). | `video_processing_jobs` |
| `transcoding` | Converting video format/quality. | `video_processing_jobs` |
| `extract_frame` | Extracting a still frame from a video. | `video_processing_jobs` |
| `merge_audio_chunks` | Merging chunked audio recordings into a single file. | `video_processing_jobs` |

### `transcoding_job_status`

State of a GPU transcoding job on Cloud Run.

| Value | Description | Used In |
|-------|-------------|---------|
| `pending` | Job created but not yet started. Default value. | `video_transcoding_jobs` |
| `running` | Job is actively transcoding on Cloud Run. | `video_transcoding_jobs` |
| `completed` | Transcoding finished. Output at `outputGcsPath`. | `video_transcoding_jobs` |
| `failed` | Transcoding failed. Error in `errorMessage`. | `video_transcoding_jobs` |
| `cancelled` | Job was cancelled before completion. | `video_transcoding_jobs` |

### `transcoding_format`

Target video codec for transcoding operations.

| Value | Description | Used In |
|-------|-------------|---------|
| `h264` | H.264/AVC. Most compatible format. Default value. | `video_transcoding_jobs` |
| `h265` | H.265/HEVC. Better compression, less compatibility. | `video_transcoding_jobs` |
| `vp9` | VP9. Google's open codec. Good for web. | `video_transcoding_jobs` |
| `av1` | AV1. Best compression, limited hardware support. | `video_transcoding_jobs` |

### `transcoding_quality`

Quality preset for transcoding. Maps to FFmpeg quality settings.

| Value | Description | Used In |
|-------|-------------|---------|
| `low` | Low quality. Smallest file size. | `video_transcoding_jobs` |
| `medium` | Medium quality. Balanced. | `video_transcoding_jobs` |
| `high` | High quality. Larger file size. Default value. | `video_transcoding_jobs` |
| `ultra` | Maximum quality. Largest file size. | `video_transcoding_jobs` |

---

## Modules & Prompts

### `therapeutic_domain`

The four therapeutic domains in the StoryCare narrative therapy model.

| Value | Description | Used In |
|-------|-------------|---------|
| `self_strength` | Self-strength and personal resilience work. | `treatment_modules` |
| `relationships_repair` | Relationship repair and interpersonal healing. | `treatment_modules` |
| `identity_transformation` | Identity exploration and transformation. | `treatment_modules` |
| `purpose_future` | Purpose discovery and future-oriented planning. | `treatment_modules` |

### `module_status`

Lifecycle state of a treatment module.

| Value | Description | Used In |
|-------|-------------|---------|
| `active` | Module is available for use. Default value. | `treatment_modules` |
| `archived` | Module is retired but retained for historical sessions. | `treatment_modules` |
| `pending_approval` | Module submitted and waiting for admin review. | `treatment_modules` |

### `generation_source`

Tracks how a story page was created.

| Value | Description | Used In |
|-------|-------------|---------|
| `manual` | Manually created by a therapist. Default value. | `story_pages` |
| `module_auto` | Automatically generated by a treatment module workflow. | `story_pages` |
| `ai_suggested` | Suggested by AI and approved by the therapist. | `story_pages` |

---

## Notifications

### `notification_type`

Classifies the type of email notification sent via Paubox.

| Value | Description | Used In |
|-------|-------------|---------|
| `story_page_published` | Notification that a new story page is available. | `email_notifications` |
| `module_completed` | Notification that a treatment module session is complete. | `email_notifications` |
| `session_reminder` | Reminder about an upcoming therapy session. | `email_notifications` |
| `survey_reminder` | Reminder to complete a pending survey. | `email_notifications` |
| `therapist_invitation` | Invitation for a new therapist to join the platform. | `email_notifications` |
| `patient_invitation` | Invitation for a new patient to join the platform. | `email_notifications` |
| `org_admin_invitation` | Invitation for a new organization admin. | `email_notifications` |

### `notification_status`

Delivery status tracking for email notifications.

| Value | Description | Used In |
|-------|-------------|---------|
| `pending` | Email queued for delivery. Default value. | `email_notifications` |
| `sent` | Email successfully sent via Paubox. `sentAt` is set. | `email_notifications` |
| `failed` | Email delivery failed. Error in `errorMessage`. | `email_notifications` |
| `bounced` | Email bounced back from the recipient's server. | `email_notifications` |
| `opened` | Recipient opened the email. `openedAt` is set. | `email_notifications` |
| `clicked` | Recipient clicked a link in the email. `clickedAt` is set. | `email_notifications` |

---

## Chat

### `chat_role`

Role of a message in an AI chat conversation.

| Value | Description | Used In |
|-------|-------------|---------|
| `user` | Message sent by the therapist. | `ai_chat_messages` |
| `assistant` | Response generated by the AI model (GPT-4, Gemini, etc.). | `ai_chat_messages` |
| `system` | System instruction or context message. | `ai_chat_messages` |

---

## Music

### `music_generation_status`

State of a music generation task via Suno AI.

| Value | Description | Used In |
|-------|-------------|---------|
| `pending` | Task created but not yet submitted to Suno. Default value. | `music_generation_tasks` |
| `processing` | Suno is generating the music. Progress tracked in `progress` (0-100). | `music_generation_tasks` |
| `completed` | Music generated successfully. Audio URL available. | `music_generation_tasks` |
| `failed` | Music generation failed. Error in `error` field. | `music_generation_tasks` |

---

## Recordings

### `recording_source`

Identifies how a recording was captured.

| Value | Description | Used In |
|-------|-------------|---------|
| `direct` | Recorded directly in the browser by the therapist. | `uploaded_recordings` |
| `share_link` | Recorded via a shareable recording link (e.g., mobile). | `uploaded_recordings` |

### `uploaded_recording_status`

Lifecycle state of an uploaded audio recording.

| Value | Description | Used In |
|-------|-------------|---------|
| `recording` | Currently being recorded in the browser. | `uploaded_recordings` |
| `uploading` | Audio chunks are being uploaded to GCS. | `uploaded_recordings` |
| `merging` | Audio chunks are being merged into a single file via Cloud Run. | `uploaded_recordings` |
| `completed` | Recording finished and all chunks uploaded. `finalAudioUrl` is set. | `uploaded_recordings` |
| `failed` | Recording or upload failed. | `uploaded_recordings` |
| `used` | A therapy session has been created from this recording. `sessionId` is set. | `uploaded_recordings` |

### `recording_link_status`

Lifecycle state of a shareable recording link.

| Value | Description | Used In |
|-------|-------------|---------|
| `pending` | Link created, waiting for someone to start recording. Default value. | `recording_links` |
| `recording` | Recording is in progress via this link. | `recording_links` |
| `completed` | Recording has been submitted through this link. | `recording_links` |
| `expired` | Link has passed its `expiresAt` timestamp. | `recording_links` |
| `revoked` | Link was manually revoked by the therapist. | `recording_links` |

---

## Clinical Assessments

### `instrument_type`

Clinical domain classification for assessment instruments (e.g., PCL-5, PHQ-9).

| Value | Description | Used In |
|-------|-------------|---------|
| `ptsd` | PTSD assessment instruments (e.g., PCL-5). | `assessment_instruments` |
| `depression` | Depression assessment instruments (e.g., PHQ-9). | `assessment_instruments` |
| `schizophrenia` | Schizophrenia-related instruments. | `assessment_instruments` |
| `substance_use` | Substance use disorder instruments. | `assessment_instruments` |
| `anxiety` | Anxiety assessment instruments (e.g., GAD-7). | `assessment_instruments` |
| `enrollment` | Enrollment or intake instruments. | `assessment_instruments` |
| `general` | General-purpose instruments. | `assessment_instruments` |

### `assessment_timepoint`

When in the treatment timeline an assessment is administered.

| Value | Description | Used In |
|-------|-------------|---------|
| `screening` | Initial screening before treatment begins. | `assessment_sessions` |
| `baseline` | Baseline measurement at start of treatment. | `assessment_sessions` |
| `mid_treatment` | Mid-treatment checkpoint. | `assessment_sessions` |
| `post_treatment` | Immediately after treatment completion. | `assessment_sessions` |
| `follow_up_1m` | 1-month follow-up. | `assessment_sessions` |
| `follow_up_3m` | 3-month follow-up. | `assessment_sessions` |
| `follow_up_6m` | 6-month follow-up. | `assessment_sessions` |
| `follow_up_12m` | 12-month follow-up. | `assessment_sessions` |
| `other` | Custom or non-standard timepoint. | `assessment_sessions` |

### `assessment_session_status`

State of a patient's assessment session.

| Value | Description | Used In |
|-------|-------------|---------|
| `in_progress` | Patient is actively completing the assessment. Default value. | `assessment_sessions` |
| `completed` | All items answered. Scores calculated. `completedAt` is set. | `assessment_sessions` |
| `abandoned` | Patient did not complete the assessment. | `assessment_sessions` |

### `instrument_status`

Availability state of an assessment instrument.

| Value | Description | Used In |
|-------|-------------|---------|
| `active` | Instrument is available for new assessments. Default value. | `assessment_instruments` |
| `inactive` | Instrument is disabled and cannot be used for new assessments. | `assessment_instruments` |

### `assessment_item_type`

Response format for individual assessment items.

| Value | Description | Used In |
|-------|-------------|---------|
| `likert` | Likert scale (numeric rating). Default type. Uses `scaleMin`/`scaleMax`. | `assessment_instrument_items` |
| `multi_choice` | Multiple choice selection from predefined options. | `assessment_instrument_items` |
| `open_text` | Free-form text response. | `assessment_instrument_items` |
| `select` | Single selection from a dropdown. | `assessment_instrument_items` |
| `number` | Numeric input. | `assessment_instrument_items` |
| `date` | Date input. | `assessment_instrument_items` |

---

## AI Models

### `model_category`

Functional classification of AI models in the platform.

| Value | Description | Used In |
|-------|-------------|---------|
| `text_to_image` | Text prompt to image generation (e.g., Vertex AI Imagen). | `ai_models` |
| `image_to_image` | Image transformation/editing (e.g., style transfer). | `ai_models` |
| `image_to_text` | Image analysis and description. | `ai_models` |
| `text_to_text` | Text generation and analysis (e.g., GPT-4, Gemini). | `ai_models` |
| `text_to_video` | Text prompt to video generation. | `ai_models` |
| `image_to_video` | Animate a static image into video. | `ai_models` |
| `music_generation` | Music/audio generation (e.g., Suno AI). | `ai_models` |
| `transcription` | Speech-to-text transcription (e.g., Deepgram). Single-active constraint. | `ai_models` |

### `model_status`

Visibility and availability state of an AI model.

| Value | Description | Used In |
|-------|-------------|---------|
| `active` | Model is available for selection by therapists. Default value. | `ai_models` |
| `hidden` | Model exists but is not shown in the UI. | `ai_models` |
| `deprecated` | Model is being phased out. May still work but discouraged. | `ai_models` |
| `disabled` | Model is completely disabled and cannot be used. | `ai_models` |

### `pricing_unit`

Unit of measurement for AI model cost tracking.

| Value | Description | Used In |
|-------|-------------|---------|
| `per_image` | Cost per image generated. | `ai_models` |
| `per_second` | Cost per second of audio/video generated. | `ai_models` |
| `per_minute` | Cost per minute of audio/video processed. | `ai_models` |
| `per_1k_tokens` | Cost per 1,000 tokens (text models). | `ai_models` |
| `per_request` | Flat cost per API request. | `ai_models` |

---

## Audit

### `audit_action`

Type of auditable action for HIPAA compliance logging.

| Value | Description | Used In |
|-------|-------------|---------|
| `create` | A resource was created (e.g., new session, patient, media). | `audit_logs` |
| `read` | A resource was read or viewed (PHI access). | `audit_logs` |
| `update` | A resource was modified. Old/new values may be in `metadata`. | `audit_logs` |
| `delete` | A resource was deleted (soft or hard delete). | `audit_logs` |
| `export` | Data was exported (e.g., PDF, CSV). | `audit_logs` |
| `auth_success` | Successful authentication event. | `audit_logs` |
| `auth_failed` | Failed authentication attempt. | `audit_logs` |
| `logout` | User logged out of the platform. | `audit_logs` |
