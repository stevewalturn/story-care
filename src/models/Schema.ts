import {
  bigint,
  boolean,
  date,
  decimal,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// StoryCare Database Schema
// Digital Therapeutic Platform for Narrative Therapy

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum('user_role', [
  'super_admin',
  'org_admin',
  'therapist',
  'patient',
]);
export const userStatusEnum = pgEnum('user_status', [
  'invited', // Pre-created by org admin/super admin, waiting for first sign-in
  'active',
  'inactive',
]);
export const organizationStatusEnum = pgEnum('organization_status', [
  'active',
  'suspended',
]);
export const templateScopeEnum = pgEnum('template_scope', [
  'system',
  'organization',
  'private',
]);
export const templateStatusEnum = pgEnum('template_status', [
  'active',
  'pending_approval',
  'rejected',
  'archived',
]);
export const templateCategoryEnum = pgEnum('template_category', [
  'screening',
  'outcome',
  'satisfaction',
  'custom',
  'narrative',
  'emotion',
  'goal-setting',
]);
export const sessionTypeEnum = pgEnum('session_type', ['individual', 'group']);
export const transcriptionStatusEnum = pgEnum('transcription_status', [
  'pending',
  'processing',
  'completed',
  'failed',
]);
export const speakerTypeEnum = pgEnum('speaker_type', [
  'therapist',
  'patient',
  'group_member',
]);
export const mediaTypeEnum = pgEnum('media_type', ['image', 'video', 'audio']);
export const sourceTypeEnum = pgEnum('source_type', [
  'generated',
  'uploaded',
  'scene',
  'animated_from_image',
  'therapist_created',
]);
export const mediaStatusEnum = pgEnum('media_status', [
  'processing',
  'completed',
  'failed',
]);
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high']);
export const sceneStatusEnum = pgEnum('scene_status', [
  'draft',
  'processing',
  'completed',
  'failed',
]);
export const jobStatusEnum = pgEnum('job_status', [
  'pending',
  'processing',
  'completed',
  'failed',
]);
export const jobTypeEnum = pgEnum('job_type', [
  'scene_assembly',
  'video_generation',
  'transcoding',
]);
export const blockTypeEnum = pgEnum('block_type', [
  'video',
  'image',
  'text',
  'quote',
  'scene',
  'reflection',
  'survey',
]);
export const pageStatusEnum = pgEnum('page_status', ['draft', 'published', 'archived']);
export const visibilityEnum = pgEnum('visibility', ['private', 'patient_only']);
// Reflection questions only support open text responses
export const reflectionQuestionTypeEnum = pgEnum('reflection_question_type', [
  'open_text',
]);

// Survey questions support all types including multiple choice
export const surveyQuestionTypeEnum = pgEnum('survey_question_type', [
  'open_text',
  'multiple_choice',
  'scale',
  'emotion',
]);

// Legacy enum - kept for backward compatibility, will be removed after migration
export const questionTypeEnum = pgEnum('question_type', [
  'open_text',
  'multiple_choice',
  'scale',
  'emotion',
]);
export const auditActionEnum = pgEnum('audit_action', [
  'create',
  'read',
  'update',
  'delete',
  'export',
  'auth_success',
  'auth_failed',
  'logout',
]);
export const chatRoleEnum = pgEnum('chat_role', ['user', 'assistant', 'system']);
export const musicGenerationStatusEnum = pgEnum('music_generation_status', [
  'pending',
  'processing',
  'completed',
  'failed',
]);
export const transcodingJobStatusEnum = pgEnum('transcoding_job_status', [
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
]);
export const transcodingFormatEnum = pgEnum('transcoding_format', ['h264', 'h265', 'vp9', 'av1']);
export const transcodingQualityEnum = pgEnum('transcoding_quality', ['low', 'medium', 'high', 'ultra']);

// Treatment Module System Enums
export const therapeuticDomainEnum = pgEnum('therapeutic_domain', [
  'self_strength',
  'relationships_repair',
  'identity_transformation',
  'purpose_future',
]);
export type TherapeuticDomain = typeof therapeuticDomainEnum.enumValues[number];

export const moduleStatusEnum = pgEnum('module_status', ['active', 'archived', 'pending_approval']);
export const notificationTypeEnum = pgEnum('notification_type', [
  'story_page_published',
  'module_completed',
  'session_reminder',
  'survey_reminder',
  'therapist_invitation',
  'patient_invitation',
  'org_admin_invitation',
]);
export const notificationStatusEnum = pgEnum('notification_status', [
  'pending',
  'sent',
  'failed',
  'bounced',
  'opened',
  'clicked',
]);
export const generationSourceEnum = pgEnum('generation_source', [
  'manual',
  'module_auto',
  'ai_suggested',
]);

// ============================================================================
// ORGANIZATIONS
// ============================================================================

export const organizationsSchema = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  contactEmail: varchar('contact_email', { length: 255 }).notNull(),
  logoUrl: text('logo_url'),
  primaryColor: varchar('primary_color', { length: 7 }), // Hex color code

  // Settings (JSONB for flexibility)
  settings: jsonb('settings')
    .default({
      subscriptionTier: 'basic',
      features: {
        maxTherapists: 5,
        maxPatients: 50,
        aiCreditsPerMonth: 1000,
        storageGB: 10,
      },
      defaults: {
        reflectionQuestions: [],
        surveyTemplate: null,
        sessionTranscriptionEnabled: true,
      },
      branding: {
        welcomeMessage: null,
        supportEmail: null,
      },
    })
    .notNull(),

  status: organizationStatusEnum('status').default('active').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'), // References users.id (super admin who created it) - nullable initially for bootstrap
});

// ============================================================================
// USERS & AUTHENTICATION
// ============================================================================

export const usersSchema: any = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull(),

  // Organization membership
  organizationId: uuid('organization_id').references(() => organizationsSchema.id, {
    onDelete: 'restrict',
  }),

  // User status for approval workflow
  status: userStatusEnum('status').default('active').notNull(),

  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),

  // Therapist specific
  licenseNumber: varchar('license_number', { length: 100 }),
  specialty: text('specialty'),

  // Patient specific (if role='patient')
  therapistId: uuid('therapist_id').references(() => usersSchema.id),
  dateOfBirth: date('date_of_birth'),
  referenceImageUrl: text('reference_image_url'), // For AI image generation

  // Firebase Auth
  firebaseUid: varchar('firebase_uid', { length: 255 }).unique(),

  // Soft delete for HIPAA compliance
  deletedAt: timestamp('deleted_at'),
});

// ============================================================================
// GROUPS & GROUP MEMBERS
// ============================================================================

export const groupsSchema = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),

  // Organization scoping
  organizationId: uuid('organization_id')
    .references(() => organizationsSchema.id, { onDelete: 'cascade' })
    .notNull(),

  therapistId: uuid('therapist_id')
    .references(() => usersSchema.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  archivedAt: timestamp('archived_at'),
});

export const groupMembersSchema = pgTable('group_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').references(() => groupsSchema.id, {
    onDelete: 'cascade',
  }),
  patientId: uuid('patient_id').references(() => usersSchema.id, {
    onDelete: 'cascade',
  }),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  leftAt: timestamp('left_at'),
});

// ============================================================================
// SESSIONS & TRANSCRIPTS
// ============================================================================

export const sessionsSchema = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  sessionDate: date('session_date').notNull(),
  sessionType: sessionTypeEnum('session_type').notNull(),

  // Relationships
  therapistId: uuid('therapist_id')
    .references(() => usersSchema.id)
    .notNull(),
  patientId: uuid('patient_id').references(() => usersSchema.id), // If individual
  groupId: uuid('group_id').references(() => groupsSchema.id), // If group

  // Audio
  audioUrl: text('audio_url').notNull(),
  audioDurationSeconds: integer('audio_duration_seconds'),
  audioFileSizeBytes: bigint('audio_file_size_bytes', { mode: 'number' }),

  // Processing status
  transcriptionStatus: transcriptionStatusEnum('transcription_status').default(
    'pending',
  ),
  transcriptionError: text('transcription_error'),

  // Treatment Module Integration
  moduleId: uuid('module_id'), // Will reference treatment_modules.id
  moduleAssignedAt: timestamp('module_assigned_at'),

  // AI-Generated Session Summary (for context caching)
  sessionSummary: text('session_summary'),
  sessionSummaryGeneratedAt: timestamp('session_summary_generated_at'),
  sessionSummaryModel: varchar('session_summary_model', { length: 50 }),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  // Soft delete for HIPAA compliance (PHI data)
  deletedAt: timestamp('deleted_at'),
});

export const transcriptsSchema = pgTable('transcripts', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .references(() => sessionsSchema.id, { onDelete: 'cascade' })
    .unique()
    .notNull(),

  // Full transcript
  fullText: text('full_text').notNull(),

  // Deepgram metadata
  confidenceScore: decimal('confidence_score', { precision: 5, scale: 4 }),
  languageCode: varchar('language_code', { length: 10 }).default('en'),

  // Status
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  // Soft delete for HIPAA compliance (PHI data)
  deletedAt: timestamp('deleted_at'),
});

export const speakersSchema = pgTable('speakers', {
  id: uuid('id').primaryKey().defaultRandom(),
  transcriptId: uuid('transcript_id')
    .references(() => transcriptsSchema.id, { onDelete: 'cascade' })
    .notNull(),

  // Diarization
  speakerLabel: varchar('speaker_label', { length: 50 }).notNull(), // 'Speaker 0', 'Speaker 1', etc.

  // Identification
  speakerType: speakerTypeEnum('speaker_type'),
  speakerName: varchar('speaker_name', { length: 255 }),
  userId: uuid('user_id').references(() => usersSchema.id), // Link to patient if identified

  // Stats
  totalUtterances: integer('total_utterances').default(0),
  totalDurationSeconds: integer('total_duration_seconds').default(0),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const utterancesSchema = pgTable('utterances', {
  id: uuid('id').primaryKey().defaultRandom(),
  transcriptId: uuid('transcript_id')
    .references(() => transcriptsSchema.id, { onDelete: 'cascade' })
    .notNull(),
  speakerId: uuid('speaker_id')
    .references(() => speakersSchema.id, { onDelete: 'cascade' })
    .notNull(),

  // Content
  text: text('text').notNull(),

  // Timing
  startTimeSeconds: decimal('start_time_seconds', { precision: 10, scale: 3 }).notNull(),
  endTimeSeconds: decimal('end_time_seconds', { precision: 10, scale: 3 }).notNull(),

  // Metadata
  confidenceScore: decimal('confidence_score', { precision: 5, scale: 4 }),
  sequenceNumber: integer('sequence_number').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// AI CHAT MESSAGES
// ============================================================================

export const aiChatMessagesSchema = pgTable('ai_chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Context
  sessionId: uuid('session_id')
    .references(() => sessionsSchema.id, { onDelete: 'cascade' })
    .notNull(),
  therapistId: uuid('therapist_id')
    .references(() => usersSchema.id)
    .notNull(),

  // Message
  role: chatRoleEnum('role').notNull(),
  content: text('content').notNull(),

  // AI Model used for generation
  aiModel: varchar('ai_model', { length: 50 }), // e.g., 'gpt-4o', 'gemini-2.5-pro'

  // Transcript selection context
  selectedText: text('selected_text'),
  selectedUtteranceIds: uuid('selected_utterance_ids').array(),

  // Generated media reference (if this message resulted in media generation)
  generatedMediaId: uuid('generated_media_id'),

  // Generation metadata
  promptType: varchar('prompt_type', { length: 100 }), // 'image', 'video', 'analysis', 'quote', 'conversation_summary', etc.

  // For conversation summaries - tracks what messages were summarized
  summaryUpToMessageId: uuid('summary_up_to_message_id'),

  // JSON Output Support
  messageType: varchar('message_type', { length: 50 }).default('text'), // 'text', 'json', 'system', 'progress'
  jsonData: jsonb('json_data'), // Structured JSON data when messageType is 'json'
  actionStatus: varchar('action_status', { length: 50 }), // 'pending', 'processing', 'completed', 'failed'

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// MEDIA LIBRARY
// ============================================================================

export const mediaLibrarySchema: any = pgTable('media_library', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Ownership
  // patientId is nullable to support group session media
  patientId: uuid('patient_id').references(() => usersSchema.id),
  createdByTherapistId: uuid('created_by_therapist_id')
    .references(() => usersSchema.id)
    .notNull(),

  // Media details
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  mediaType: mediaTypeEnum('media_type').notNull(),
  mediaUrl: text('media_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),

  // File metadata
  fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }),
  durationSeconds: integer('duration_seconds'), // For video/audio
  widthPx: integer('width_px'), // For image/video
  heightPx: integer('height_px'),

  // Source tracking
  sourceType: sourceTypeEnum('source_type').notNull(),
  sourceSessionId: uuid('source_session_id').references(() => sessionsSchema.id),
  sourceMediaId: uuid('source_media_id').references(() => mediaLibrarySchema.id), // If derived

  // AI generation metadata
  generationPrompt: text('generation_prompt'),
  aiModel: varchar('ai_model', { length: 100 }),
  referenceImageUrl: text('reference_image_url'),

  // Chat context (if generated from AI chat)
  chatMessageId: uuid('chat_message_id'), // References ai_chat_messages
  sourceSelection: text('source_selection'), // Original transcript text selected

  // Tags (array of strings)
  tags: text('tags').array(),

  // Status
  status: mediaStatusEnum('status').default('completed'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  // Soft delete for HIPAA compliance (PHI data)
  deletedAt: timestamp('deleted_at'),
});

// ============================================================================
// MUSIC GENERATION TASKS
// ============================================================================

export const musicGenerationTasksSchema: any = pgTable('music_generation_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: varchar('task_id', { length: 255 }).notNull().unique(), // music_123_abc format
  sunoTaskId: varchar('suno_task_id', { length: 255 }), // Suno's task ID

  // Status tracking
  status: musicGenerationStatusEnum('status').notNull().default('pending'),
  progress: integer('progress').notNull().default(0), // 0-100

  // Request parameters
  prompt: text('prompt'),
  style: varchar('style', { length: 1000 }),
  title: varchar('title', { length: 100 }),
  model: varchar('model', { length: 50 }).notNull().default('V4_5'),
  customMode: boolean('custom_mode').notNull().default(false),
  instrumental: boolean('instrumental').notNull().default(true),

  // Advanced V5 parameters
  personaId: varchar('persona_id', { length: 255 }),
  negativeTags: text('negative_tags'),
  vocalGender: varchar('vocal_gender', { length: 1 }), // 'm' or 'f'
  styleWeight: decimal('style_weight', { precision: 3, scale: 2 }), // 0.00-1.00
  weirdnessConstraint: decimal('weirdness_constraint', { precision: 3, scale: 2 }),
  audioWeight: decimal('audio_weight', { precision: 3, scale: 2 }),

  // Result
  mediaId: uuid('media_id').references(() => mediaLibrarySchema.id),
  audioUrl: text('audio_url'), // Suno's audio URL
  duration: integer('duration'), // Duration in seconds

  // Error handling
  error: text('error'),
  retryCount: integer('retry_count').notNull().default(0),

  // Relationships
  patientId: uuid('patient_id')
    .notNull()
    .references(() => usersSchema.id),
  sessionId: uuid('session_id').references(() => sessionsSchema.id),
  createdByTherapistId: uuid('created_by_therapist_id')
    .notNull()
    .references(() => usersSchema.id),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// ============================================================================
// QUOTES & NOTES
// ============================================================================

export const quotesSchema = pgTable('quotes', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Ownership
  patientId: uuid('patient_id')
    .references(() => usersSchema.id)
    .notNull(),
  sessionId: uuid('session_id').references(() => sessionsSchema.id),

  // Quote content
  quoteText: text('quote_text').notNull(),
  speakerId: uuid('speaker_id').references(() => speakersSchema.id),

  // Timing (if from transcript)
  startTimeSeconds: decimal('start_time_seconds', { precision: 10, scale: 3 }),
  endTimeSeconds: decimal('end_time_seconds', { precision: 10, scale: 3 }),

  // Metadata
  tags: text('tags').array(),
  notes: text('notes'),

  createdByTherapistId: uuid('created_by_therapist_id')
    .references(() => usersSchema.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const notesSchema = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Ownership
  patientId: uuid('patient_id')
    .references(() => usersSchema.id)
    .notNull(),
  therapistId: uuid('therapist_id')
    .references(() => usersSchema.id)
    .notNull(),

  // Content
  title: varchar('title', { length: 255 }),
  content: text('content').notNull(),

  // Context
  sessionId: uuid('session_id').references(() => sessionsSchema.id),
  tags: text('tags').array(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// TEMPLATE LIBRARY (Survey & Reflection Templates)
// ============================================================================

export const surveyTemplatesSchema = pgTable('survey_templates', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Scope and ownership
  scope: templateScopeEnum('scope').default('private').notNull(),
  organizationId: uuid('organization_id').references(() => organizationsSchema.id, {
    onDelete: 'cascade',
  }),
  createdBy: uuid('created_by')
    .references(() => usersSchema.id)
    .notNull(),

  // Approval workflow
  approvedBy: uuid('approved_by').references(() => usersSchema.id),
  approvedAt: timestamp('approved_at'),
  status: templateStatusEnum('status').default('active').notNull(),
  rejectionReason: text('rejection_reason'),

  // Template content
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  category: templateCategoryEnum('category').default('custom').notNull(),

  // Questions (JSONB array)
  questions: jsonb('questions').notNull(), // Array of question objects

  // Usage tracking
  useCount: integer('use_count').default(0).notNull(),

  // Metadata
  metadata: jsonb('metadata'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const reflectionTemplatesSchema = pgTable('reflection_templates', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Scope and ownership
  scope: templateScopeEnum('scope').default('private').notNull(),
  organizationId: uuid('organization_id').references(() => organizationsSchema.id, {
    onDelete: 'cascade',
  }),
  createdBy: uuid('created_by')
    .references(() => usersSchema.id)
    .notNull(),

  // Approval workflow
  approvedBy: uuid('approved_by').references(() => usersSchema.id),
  approvedAt: timestamp('approved_at'),
  status: templateStatusEnum('status').default('active').notNull(),
  rejectionReason: text('rejection_reason'),

  // Template content
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  category: templateCategoryEnum('category').default('custom').notNull(),

  // Questions (JSONB array)
  questions: jsonb('questions').notNull(), // Array of question objects

  // Usage tracking
  useCount: integer('use_count').default(0).notNull(),

  // Metadata
  metadata: jsonb('metadata'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// THERAPEUTIC PROMPTS
// ============================================================================

export const therapeuticPromptsSchema = pgTable('therapeutic_prompts', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Scope and ownership
  scope: templateScopeEnum('scope').default('private').notNull(),
  organizationId: uuid('organization_id').references(() => organizationsSchema.id, {
    onDelete: 'cascade',
  }),
  createdBy: uuid('created_by')
    .references(() => usersSchema.id)
    .notNull(),

  // Approval workflow
  approvedBy: uuid('approved_by').references(() => usersSchema.id),
  approvedAt: timestamp('approved_at'),
  status: templateStatusEnum('status').default('active').notNull(),
  rejectionReason: text('rejection_reason'),

  // Legacy field (deprecated, use createdBy instead)
  therapistId: uuid('therapist_id').references(() => usersSchema.id),

  // Prompt content
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  promptText: text('prompt_text').notNull(),

  // Classification
  category: varchar('category', { length: 100 }).notNull(), // 'image-generation', 'video-generation', 'analysis', 'reflection'
  tags: text('tags').array(),

  // Usage
  isFavorite: boolean('is_favorite').default(false),
  useCount: integer('use_count').default(0),

  // Metadata
  metadata: jsonb('metadata'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// TREATMENT MODULES
// ============================================================================

export const treatmentModulesSchema = pgTable('treatment_modules', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Basic Information
  name: varchar('name', { length: 255 }).notNull(),
  domain: therapeuticDomainEnum('domain').notNull(),
  description: text('description').notNull(),

  // Scope & Ownership
  scope: templateScopeEnum('scope').default('system').notNull(),
  organizationId: uuid('organization_id').references(() => organizationsSchema.id, {
    onDelete: 'cascade',
  }),
  createdBy: uuid('created_by')
    .references(() => usersSchema.id)
    .notNull(),

  // AI Prompts
  aiPromptText: text('ai_prompt_text').notNull(),
  aiPromptMetadata: jsonb('ai_prompt_metadata'), // { output_format: 'structured', expected_fields: [...] }

  // Usage Tracking
  useCount: integer('use_count').default(0).notNull(),
  status: moduleStatusEnum('status').default('active').notNull(),

  // Audit
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// MODULE AI PROMPTS
// ============================================================================

export const moduleAiPromptsSchema = pgTable('module_ai_prompts', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Prompt Details
  name: varchar('name', { length: 255 }).notNull(),
  promptText: text('prompt_text').notNull(),
  description: text('description'),

  // Classification
  category: varchar('category', { length: 100 }).notNull(), // 'analysis', 'creative', 'extraction', 'reflection'
  icon: varchar('icon', { length: 50 }).default('sparkles'), // Icon name for UI (e.g., 'sparkles', 'target', 'lightbulb')
  outputType: varchar('output_type', { length: 50 }).default('text'), // 'text' or 'json'
  jsonSchema: jsonb('json_schema'), // JSON schema definition for structured outputs

  // Building Blocks Support (NEW)
  blocks: jsonb('blocks'), // Array of BlockInstance[] for form-based prompt builder
  useAdvancedMode: boolean('use_advanced_mode').default(false), // True for JSON editor, false for building blocks

  // Scope & Ownership (same as treatment_modules)
  scope: templateScopeEnum('scope').default('system').notNull(),
  organizationId: uuid('organization_id').references(() => organizationsSchema.id, {
    onDelete: 'cascade',
  }),
  createdBy: uuid('created_by')
    .references(() => usersSchema.id)
    .notNull(),

  // Usage Tracking
  useCount: integer('use_count').default(0).notNull(),

  // Status
  isActive: boolean('is_active').default(true).notNull(),

  // Audit
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Junction table: Links modules to their AI prompts
export const modulePromptLinksSchema = pgTable('module_prompt_links', {
  id: uuid('id').primaryKey().defaultRandom(),

  moduleId: uuid('module_id')
    .references(() => treatmentModulesSchema.id, { onDelete: 'cascade' })
    .notNull(),
  promptId: uuid('prompt_id')
    .references(() => moduleAiPromptsSchema.id, { onDelete: 'cascade' })
    .notNull(),

  // Display order in UI
  sortOrder: integer('sort_order').default(0).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// WORKFLOW EXECUTIONS
// ============================================================================

// Tracks execution state of building block workflows
export const workflowExecutionsSchema = pgTable('workflow_executions', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Workflow Definition
  promptId: uuid('prompt_id')
    .references(() => moduleAiPromptsSchema.id, { onDelete: 'cascade' })
    .notNull(),
  blocks: jsonb('blocks').notNull(), // Array of BlockInstance[] with execution status

  // Execution Context
  context: jsonb('context').notNull(), // WorkflowContext with accumulated step outputs
  initialContext: jsonb('initial_context'), // Original context at start

  // Execution State
  status: varchar('status', { length: 50 }).default('pending').notNull(), // 'pending', 'running', 'completed', 'failed', 'paused'
  currentStepIndex: integer('current_step_index').default(0).notNull(),
  error: text('error'), // Error message if failed

  // Session & User Context
  sessionId: uuid('session_id').references(() => sessionsSchema.id, {
    onDelete: 'cascade',
  }),
  patientId: uuid('patient_id').references(() => usersSchema.id, {
    onDelete: 'cascade',
  }),
  therapistId: uuid('therapist_id').references(() => usersSchema.id, {
    onDelete: 'cascade',
  }),
  organizationId: uuid('organization_id').references(() => organizationsSchema.id, {
    onDelete: 'cascade',
  }),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// SESSION-MODULE LINKING
// ============================================================================

export const sessionModulesSchema = pgTable('session_modules', {
  id: uuid('id').primaryKey().defaultRandom(),

  sessionId: uuid('session_id')
    .references(() => sessionsSchema.id, { onDelete: 'cascade' })
    .notNull(),
  moduleId: uuid('module_id').references(() => treatmentModulesSchema.id, {
    onDelete: 'set null',
  }),

  // Assignment Context
  assignedBy: uuid('assigned_by')
    .references(() => usersSchema.id)
    .notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),

  // Analysis Tracking
  aiAnalysisCompleted: boolean('ai_analysis_completed').default(false),
  aiAnalysisResult: jsonb('ai_analysis_result'), // Structured output from module-specific prompt

  // Story Page Generation
  storyPageId: uuid('story_page_id').references(() => storyPagesSchema.id),
  storyPageGeneratedAt: timestamp('story_page_generated_at'),

  notes: text('notes'), // Therapist notes about this module application

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// EMAIL NOTIFICATIONS
// ============================================================================

export const emailNotificationsSchema = pgTable('email_notifications', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Notification Context
  notificationType: notificationTypeEnum('notification_type').notNull(),
  recipientUserId: uuid('recipient_user_id')
    .references(() => usersSchema.id)
    .notNull(),
  recipientEmail: varchar('recipient_email', { length: 255 }).notNull(),

  // Content
  subject: varchar('subject', { length: 255 }).notNull(),
  bodyText: text('body_text').notNull(),
  bodyHtml: text('body_html'),

  // Related Resources
  storyPageId: uuid('story_page_id').references(() => storyPagesSchema.id),
  sessionId: uuid('session_id').references(() => sessionsSchema.id),
  moduleId: uuid('module_id').references(() => treatmentModulesSchema.id),

  // Delivery Status
  status: notificationStatusEnum('status').default('pending').notNull(),
  sentAt: timestamp('sent_at'),
  openedAt: timestamp('opened_at'),
  clickedAt: timestamp('clicked_at'),
  errorMessage: text('error_message'),

  // Email Service Metadata
  externalId: varchar('external_id', { length: 255 }), // SendGrid message ID

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// SCENES
// ============================================================================

export const scenesSchema = pgTable('scenes', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Ownership
  patientId: uuid('patient_id')
    .references(() => usersSchema.id)
    .notNull(),
  createdByTherapistId: uuid('created_by_therapist_id')
    .references(() => usersSchema.id)
    .notNull(),

  // Scene details
  title: varchar('title', { length: 255 }),
  description: text('description'),

  // Output
  videoUrl: text('video_url'),
  assembledVideoUrl: text('assembled_video_url'),
  thumbnailUrl: text('thumbnail_url'),
  durationSeconds: varchar('duration_seconds', { length: 50 }),

  // Audio settings (legacy - kept for backward compatibility)
  backgroundAudioUrl: text('background_audio_url'),
  loopAudio: boolean('loop_audio').default(false),

  // New audio settings
  fitAudioToDuration: boolean('fit_audio_to_duration').default(false),

  // Status
  status: sceneStatusEnum('status').default('draft'),
  processingError: text('processing_error'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sceneClipsSchema = pgTable('scene_clips', {
  id: uuid('id').primaryKey().defaultRandom(),
  sceneId: uuid('scene_id')
    .references(() => scenesSchema.id, { onDelete: 'cascade' })
    .notNull(),
  mediaId: uuid('media_id').references(() => mediaLibrarySchema.id),

  // Timeline position
  sequenceNumber: integer('sequence_number').notNull(),
  startTimeSeconds: decimal('start_time_seconds', { precision: 10, scale: 3 }).default(
    '0',
  ),
  endTimeSeconds: decimal('end_time_seconds', { precision: 10, scale: 3 }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// SCENE AUDIO TRACKS (Multiple audio layers per scene)
// ============================================================================

export const sceneAudioTracksSchema = pgTable('scene_audio_tracks', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Scene reference
  sceneId: uuid('scene_id')
    .references(() => scenesSchema.id, { onDelete: 'cascade' })
    .notNull(),

  // Audio source
  audioId: uuid('audio_id').references(() => mediaLibrarySchema.id), // Optional FK to media library
  audioUrl: text('audio_url').notNull(), // GCS URL or external URL
  title: varchar('title', { length: 255 }), // Display name for the audio track

  // Timeline position
  startTimeSeconds: decimal('start_time_seconds', { precision: 10, scale: 3 }).default('0'),
  durationSeconds: decimal('duration_seconds', { precision: 10, scale: 3 }), // Original audio duration

  // Audio settings
  volume: integer('volume').default(100), // 0-100%

  // Ordering
  sequenceNumber: integer('sequence_number').notNull(), // For z-index/layering

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// STORY PAGES
// ============================================================================

export const storyPagesSchema = pgTable('story_pages', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Ownership
  patientId: uuid('patient_id')
    .references(() => usersSchema.id)
    .notNull(),
  createdByTherapistId: uuid('created_by_therapist_id')
    .references(() => usersSchema.id)
    .notNull(),

  // Page details
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),

  // Status
  status: pageStatusEnum('status').default('draft'),
  visibility: visibilityEnum('visibility').default('private'),

  // Publishing
  publishedAt: timestamp('published_at'),

  // Shareable Links
  shareToken: varchar('share_token', { length: 64 }).unique(),
  shareExpiresAt: timestamp('share_expires_at'),
  shareExpiryDuration: varchar('share_expiry_duration', { length: 20 }), // '15min', '1hour', '2hours'
  isShareable: boolean('is_shareable').default(false),

  // Treatment Module Integration
  moduleId: uuid('module_id'), // Will reference treatment_modules.id
  autoGenerated: boolean('auto_generated').default(false),
  generationSource: generationSourceEnum('generation_source').default('manual'),
  emailNotificationId: uuid('email_notification_id'), // Will reference email_notifications.id

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Shareable Links for Story Pages
export const pageShareLinksSchema = pgTable('page_share_links', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Page reference
  pageId: uuid('page_id')
    .references(() => storyPagesSchema.id, { onDelete: 'cascade' })
    .notNull(),

  // Share token (unique, used in URL)
  token: varchar('token', { length: 64 }).unique().notNull(),

  // Expiration
  expiresAt: timestamp('expires_at').notNull(),
  expiryDurationMinutes: integer('expiry_duration_minutes').notNull(), // e.g., 60 for 1 hour

  // Metadata
  createdByTherapistId: uuid('created_by_therapist_id')
    .references(() => usersSchema.id)
    .notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  revokedAt: timestamp('revoked_at'),

  // Access tracking
  accessCount: integer('access_count').default(0).notNull(),
  lastAccessedAt: timestamp('last_accessed_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pageBlocksSchema = pgTable('page_blocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  pageId: uuid('page_id')
    .references(() => storyPagesSchema.id, { onDelete: 'cascade' })
    .notNull(),

  // Block type
  blockType: blockTypeEnum('block_type').notNull(),

  // Position
  sequenceNumber: integer('sequence_number').notNull(),

  // Content (depending on block_type)
  mediaId: uuid('media_id').references(() => mediaLibrarySchema.id),
  sceneId: uuid('scene_id').references(() => scenesSchema.id),
  textContent: text('text_content'),

  // Settings (block-specific settings as JSON)
  settings: jsonb('settings'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const reflectionQuestionsSchema = pgTable('reflection_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  blockId: uuid('block_id')
    .references(() => pageBlocksSchema.id, { onDelete: 'cascade' })
    .notNull(),

  // Question - only qualitative types allowed (no multiple_choice)
  questionText: text('question_text').notNull(),
  questionType: reflectionQuestionTypeEnum('question_type').default('open_text').notNull(),

  // Position
  sequenceNumber: integer('sequence_number').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const surveyQuestionsSchema = pgTable('survey_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  blockId: uuid('block_id')
    .references(() => pageBlocksSchema.id, { onDelete: 'cascade' })
    .notNull(),

  // Question - supports all types including multiple_choice
  questionText: text('question_text').notNull(),
  questionType: surveyQuestionTypeEnum('question_type').notNull(),

  // Scale settings
  scaleMin: integer('scale_min'),
  scaleMax: integer('scale_max'),
  scaleMinLabel: varchar('scale_min_label', { length: 100 }),
  scaleMaxLabel: varchar('scale_max_label', { length: 100 }),

  // Options (for multiple_choice) - JSON array
  options: jsonb('options'),

  // Position
  sequenceNumber: integer('sequence_number').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// PATIENT RESPONSES
// ============================================================================

export const reflectionResponsesSchema = pgTable('reflection_responses', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Context
  patientId: uuid('patient_id')
    .references(() => usersSchema.id)
    .notNull(),
  pageId: uuid('page_id')
    .references(() => storyPagesSchema.id)
    .notNull(),
  questionId: uuid('question_id')
    .references(() => reflectionQuestionsSchema.id)
    .notNull(),

  // Response
  responseText: text('response_text').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const surveyResponsesSchema = pgTable('survey_responses', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Context
  patientId: uuid('patient_id')
    .references(() => usersSchema.id)
    .notNull(),
  pageId: uuid('page_id')
    .references(() => storyPagesSchema.id)
    .notNull(),
  questionId: uuid('question_id')
    .references(() => surveyQuestionsSchema.id)
    .notNull(),

  // Response
  responseValue: text('response_value'), // Could be number, text, or emotion
  responseNumeric: integer('response_numeric'), // For scale responses

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// AUDIT LOGGING (HIPAA Compliance)
// ============================================================================

export const auditLogsSchema = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),

  // User who performed the action
  userId: uuid('user_id')
    .references(() => usersSchema.id)
    .notNull(),

  // Organization context
  organizationId: uuid('organization_id').references(() => organizationsSchema.id, {
    onDelete: 'set null',
  }),

  // Action details
  action: auditActionEnum('action').notNull(),
  resourceType: varchar('resource_type', { length: 50 }).notNull(), // 'session', 'patient', 'media', etc.
  resourceId: text('resource_id'), // ID of the resource accessed/modified (nullable for auth events, can be UUID or other identifier like file path)

  // Request details
  ipAddress: varchar('ip_address', { length: 45 }), // IPv6 max length
  userAgent: text('user_agent'),
  requestMethod: varchar('request_method', { length: 10 }), // GET, POST, PUT, DELETE
  requestPath: text('request_path'),

  // Additional context
  metadata: jsonb('metadata'), // Any additional info (old values, new values, etc.)

  // Timestamp
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// ============================================================================
// PLATFORM SETTINGS (Super Admin)
// ============================================================================

export const platformSettingsSchema = pgTable('platform_settings', {
  id: uuid('id').primaryKey().defaultRandom(),

  // General Settings
  platformName: varchar('platform_name', { length: 255 }).notNull().default('StoryCare'),
  supportEmail: varchar('support_email', { length: 255 }).notNull(),

  // AI Configuration
  defaultAiCredits: integer('default_ai_credits').notNull().default(1000),
  imageGenModel: varchar('image_gen_model', { length: 50 }).notNull().default('dall-e-3'),

  // Storage Configuration
  defaultStorageQuota: bigint('default_storage_quota', { mode: 'number' }).notNull().default(10737418240), // 10GB in bytes
  maxFileUploadSize: bigint('max_file_upload_size', { mode: 'number' }).notNull().default(524288000), // 500MB in bytes

  // Security Settings
  requireEmailVerification: boolean('require_email_verification').notNull().default(true),
  enableMfaForAdmins: boolean('enable_mfa_for_admins').notNull().default(true),
  sessionTimeout: integer('session_timeout').notNull().default(15), // minutes

  // Email Configuration
  emailFromName: varchar('email_from_name', { length: 100 }).notNull().default('StoryCare'),
  emailFromAddress: varchar('email_from_address', { length: 255 })
    .notNull()
    .default('notifications@storycare.health'),
  emailFooterText: text('email_footer_text')
    .notNull()
    .default('You received this because you are a patient in the StoryCare platform.'),
  smtpProvider: varchar('smtp_provider', { length: 50 }).notNull().default('sendgrid'),
  enableEmailNotifications: boolean('enable_email_notifications').notNull().default(true),

  // Metadata
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => usersSchema.id),
});

// ============================================================================
// VIDEO TRANSCODING JOBS (GPU Cloud Run)
// ============================================================================

export const videoTranscodingJobsSchema = pgTable('video_transcoding_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),

  // User context
  userId: uuid('user_id')
    .references(() => usersSchema.id)
    .notNull(),
  organizationId: uuid('organization_id')
    .references(() => organizationsSchema.id)
    .notNull(),

  // Job details
  executionName: varchar('execution_name', { length: 255 }), // Cloud Run Job execution ID
  status: transcodingJobStatusEnum('status').default('pending').notNull(),

  // Input/Output files
  inputFilename: varchar('input_filename', { length: 500 }).notNull(),
  outputFilename: varchar('output_filename', { length: 500 }).notNull(),
  inputGcsPath: text('input_gcs_path').notNull(), // gs://preprocessing-{project}/filename
  outputGcsPath: text('output_gcs_path'), // gs://transcoded-{project}/filename

  // Transcoding configuration
  format: transcodingFormatEnum('format').default('h264').notNull(),
  quality: transcodingQualityEnum('quality').default('high').notNull(),
  width: integer('width'), // Target width in pixels
  height: integer('height'), // Target height in pixels
  fps: integer('fps'), // Target frames per second
  customArgs: jsonb('custom_args'), // Custom FFmpeg arguments as array

  // Job metadata
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  errorMessage: text('error_message'),

  // Cost tracking (estimated)
  estimatedCostUsd: decimal('estimated_cost_usd', { precision: 10, scale: 4 }),
  durationSeconds: integer('duration_seconds'), // Job execution time

  // File metadata
  inputFileSizeBytes: bigint('input_file_size_bytes', { mode: 'number' }),
  outputFileSizeBytes: bigint('output_file_size_bytes', { mode: 'number' }),

  // Additional metadata
  metadata: jsonb('metadata'), // Any additional info (video resolution, codec, etc.)

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// VIDEO PROCESSING JOBS (Async FFmpeg Scene Assembly)
// ============================================================================

export const videoProcessingJobsSchema = pgTable('video_processing_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Job metadata
  jobType: jobTypeEnum('job_type').notNull(),
  status: jobStatusEnum('status').default('pending').notNull(),

  // Resource references
  sceneId: uuid('scene_id').references(() => scenesSchema.id, { onDelete: 'cascade' }),
  mediaId: uuid('media_id').references(() => mediaLibrarySchema.id, {
    onDelete: 'set null',
  }),

  // Job progress
  progress: integer('progress').default(0).notNull(), // 0-100
  currentStep: varchar('current_step', { length: 255 }), // e.g., "Downloading clips", "Encoding video"

  // Input/Output data
  inputData: jsonb('input_data'), // Clips, audio tracks, settings
  outputUrl: text('output_url'), // Final video URL in GCS
  thumbnailUrl: text('thumbnail_url'),

  // Error handling
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0).notNull(),
  maxRetries: integer('max_retries').default(3).notNull(),

  // Cloud Run tracking
  cloudRunJobId: varchar('cloud_run_job_id', { length: 255 }), // Cloud Run execution ID
  cloudRunLogUrl: text('cloud_run_log_url'),

  // Performance metrics
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  durationSeconds: integer('duration_seconds'),

  // User tracking
  createdByUserId: uuid('created_by_user_id').references(() => usersSchema.id),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// ENGAGEMENT TRACKING
// ============================================================================

export const patientPageInteractionsSchema = pgTable('patient_page_interactions', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Context
  patientId: uuid('patient_id')
    .references(() => usersSchema.id)
    .notNull(),
  pageId: uuid('page_id')
    .references(() => storyPagesSchema.id)
    .notNull(),

  // Interaction tracking
  firstViewedAt: timestamp('first_viewed_at'),
  lastViewedAt: timestamp('last_viewed_at'),
  viewCount: integer('view_count').default(0),

  // Completion tracking
  reflectionCompleted: boolean('reflection_completed').default(false),
  surveyCompleted: boolean('survey_completed').default(false),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// TABLE ALIASES (for convenience)
// ============================================================================

// Export table schemas both with and without 'Schema' suffix
export const organizations = organizationsSchema;
export const users = usersSchema;
export const groups = groupsSchema;
export const groupMembers = groupMembersSchema;
export const sessions = sessionsSchema;
export const transcripts = transcriptsSchema;
export const speakers = speakersSchema;
export const utterances = utterancesSchema;
export const aiChatMessages = aiChatMessagesSchema;
export const mediaLibrary = mediaLibrarySchema;
export const musicGenerationTasks = musicGenerationTasksSchema;
export const quotes = quotesSchema;
export const notes = notesSchema;
export const surveyTemplates = surveyTemplatesSchema;
export const reflectionTemplates = reflectionTemplatesSchema;
export const therapeuticPrompts = therapeuticPromptsSchema;
export const treatmentModules = treatmentModulesSchema;
export const moduleAiPrompts = moduleAiPromptsSchema;
export const modulePromptLinks = modulePromptLinksSchema;
export const workflowExecutions = workflowExecutionsSchema;
export const sessionModules = sessionModulesSchema;
export const emailNotifications = emailNotificationsSchema;
export const scenes = scenesSchema;
export const sceneClips = sceneClipsSchema;
export const sceneAudioTracks = sceneAudioTracksSchema;
export const storyPages = storyPagesSchema;
export const pageShareLinks = pageShareLinksSchema;
export const pageBlocks = pageBlocksSchema;
export const reflectionQuestions = reflectionQuestionsSchema;
export const surveyQuestions = surveyQuestionsSchema;
export const reflectionResponses = reflectionResponsesSchema;
export const surveyResponses = surveyResponsesSchema;
export const patientPageInteractions = patientPageInteractionsSchema;
export const videoTranscodingJobs = videoTranscodingJobsSchema;
export const videoProcessingJobs = videoProcessingJobsSchema;
export const auditLogs = auditLogsSchema;
export const platformSettings = platformSettingsSchema;

// ============================================================================
// EXPORTS (for type inference)
// ============================================================================

export type Organization = typeof organizationsSchema.$inferSelect;
export type NewOrganization = typeof organizationsSchema.$inferInsert;

export type User = typeof usersSchema.$inferSelect;
export type NewUser = typeof usersSchema.$inferInsert;

export type Group = typeof groupsSchema.$inferSelect;
export type NewGroup = typeof groupsSchema.$inferInsert;

export type Session = typeof sessionsSchema.$inferSelect;
export type NewSession = typeof sessionsSchema.$inferInsert;

export type Transcript = typeof transcriptsSchema.$inferSelect;
export type NewTranscript = typeof transcriptsSchema.$inferInsert;

export type Speaker = typeof speakersSchema.$inferSelect;
export type NewSpeaker = typeof speakersSchema.$inferInsert;

export type Utterance = typeof utterancesSchema.$inferSelect;
export type NewUtterance = typeof utterancesSchema.$inferInsert;

export type AiChatMessage = typeof aiChatMessagesSchema.$inferSelect;
export type NewAiChatMessage = typeof aiChatMessagesSchema.$inferInsert;

export type MediaLibrary = typeof mediaLibrarySchema.$inferSelect;
export type NewMediaLibrary = typeof mediaLibrarySchema.$inferInsert;

export type MusicGenerationTask = typeof musicGenerationTasksSchema.$inferSelect;
export type NewMusicGenerationTask = typeof musicGenerationTasksSchema.$inferInsert;

export type Quote = typeof quotesSchema.$inferSelect;
export type NewQuote = typeof quotesSchema.$inferInsert;

export type Note = typeof notesSchema.$inferSelect;
export type NewNote = typeof notesSchema.$inferInsert;

export type SurveyTemplate = typeof surveyTemplatesSchema.$inferSelect;
export type NewSurveyTemplate = typeof surveyTemplatesSchema.$inferInsert;

export type ReflectionTemplate = typeof reflectionTemplatesSchema.$inferSelect;
export type NewReflectionTemplate = typeof reflectionTemplatesSchema.$inferInsert;

export type TherapeuticPrompt = typeof therapeuticPromptsSchema.$inferSelect;
export type NewTherapeuticPrompt = typeof therapeuticPromptsSchema.$inferInsert;

export type TreatmentModule = typeof treatmentModulesSchema.$inferSelect;
export type NewTreatmentModule = typeof treatmentModulesSchema.$inferInsert;

export type ModuleAiPrompt = typeof moduleAiPromptsSchema.$inferSelect;
export type NewModuleAiPrompt = typeof moduleAiPromptsSchema.$inferInsert;

// Alias for consistency with documentation
export type PromptTemplate = ModuleAiPrompt;

// Treatment module with linked AI prompts (for frontend display)
export type TreatmentModuleWithPrompts = TreatmentModule & {
  linkedPrompts?: Array<ModuleAiPrompt & { sortOrder: number }>;
};

export type ModulePromptLink = typeof modulePromptLinksSchema.$inferSelect;
export type NewModulePromptLink = typeof modulePromptLinksSchema.$inferInsert;

export type WorkflowExecutionDb = typeof workflowExecutionsSchema.$inferSelect;
export type NewWorkflowExecutionDb = typeof workflowExecutionsSchema.$inferInsert;

export type SessionModule = typeof sessionModulesSchema.$inferSelect;
export type NewSessionModule = typeof sessionModulesSchema.$inferInsert;

export type EmailNotification = typeof emailNotificationsSchema.$inferSelect;
export type NewEmailNotification = typeof emailNotificationsSchema.$inferInsert;

export type Scene = typeof scenesSchema.$inferSelect;
export type NewScene = typeof scenesSchema.$inferInsert;

export type SceneAudioTrack = typeof sceneAudioTracksSchema.$inferSelect;
export type NewSceneAudioTrack = typeof sceneAudioTracksSchema.$inferInsert;

export type StoryPage = typeof storyPagesSchema.$inferSelect;
export type NewStoryPage = typeof storyPagesSchema.$inferInsert;

export type PageBlock = typeof pageBlocksSchema.$inferSelect;
export type NewPageBlock = typeof pageBlocksSchema.$inferInsert;

export type ReflectionQuestion = typeof reflectionQuestionsSchema.$inferSelect;
export type NewReflectionQuestion = typeof reflectionQuestionsSchema.$inferInsert;

export type SurveyQuestion = typeof surveyQuestionsSchema.$inferSelect;
export type NewSurveyQuestion = typeof surveyQuestionsSchema.$inferInsert;

export type ReflectionResponse = typeof reflectionResponsesSchema.$inferSelect;
export type NewReflectionResponse = typeof reflectionResponsesSchema.$inferInsert;

export type SurveyResponse = typeof surveyResponsesSchema.$inferSelect;
export type NewSurveyResponse = typeof surveyResponsesSchema.$inferInsert;

export type PatientPageInteraction = typeof patientPageInteractionsSchema.$inferSelect;
export type NewPatientPageInteraction = typeof patientPageInteractionsSchema.$inferInsert;

export type VideoTranscodingJob = typeof videoTranscodingJobsSchema.$inferSelect;
export type NewVideoTranscodingJob = typeof videoTranscodingJobsSchema.$inferInsert;

export type VideoProcessingJob = typeof videoProcessingJobsSchema.$inferSelect;
export type NewVideoProcessingJob = typeof videoProcessingJobsSchema.$inferInsert;

export type AuditLog = typeof auditLogsSchema.$inferSelect;
export type NewAuditLog = typeof auditLogsSchema.$inferInsert;

export type PlatformSettings = typeof platformSettingsSchema.$inferSelect;
export type NewPlatformSettings = typeof platformSettingsSchema.$inferInsert;
