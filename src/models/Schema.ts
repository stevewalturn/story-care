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
  'pending_approval',
  'active',
  'inactive',
]);
export const organizationStatusEnum = pgEnum('organization_status', [
  'active',
  'trial',
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
export const blockTypeEnum = pgEnum('block_type', [
  'video',
  'image',
  'text',
  'reflection',
  'survey',
]);
export const pageStatusEnum = pgEnum('page_status', ['draft', 'published', 'archived']);
export const visibilityEnum = pgEnum('visibility', ['private', 'patient_only']);
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

  // Self-signup join code
  joinCode: varchar('join_code', { length: 50 }).unique().notNull(),
  joinCodeEnabled: boolean('join_code_enabled').default(true).notNull(),

  // Settings (JSONB for flexibility)
  settings: jsonb('settings')
    .default({
      subscriptionTier: 'trial',
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

  status: organizationStatusEnum('status').default('trial').notNull(),
  trialEndsAt: timestamp('trial_ends_at'),

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

  // Transcript selection context
  selectedText: text('selected_text'),
  selectedUtteranceIds: uuid('selected_utterance_ids').array(),

  // Generated media reference (if this message resulted in media generation)
  generatedMediaId: uuid('generated_media_id'),

  // Generation metadata
  promptType: varchar('prompt_type', { length: 100 }), // 'image', 'video', 'analysis', 'quote', etc.

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// MEDIA LIBRARY
// ============================================================================

export const mediaLibrarySchema: any = pgTable('media_library', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Ownership
  patientId: uuid('patient_id')
    .references(() => usersSchema.id)
    .notNull(),
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
  priority: priorityEnum('priority').default('medium'),
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

  // Audio settings
  backgroundAudioUrl: text('background_audio_url'),
  loopAudio: boolean('loop_audio').default(false),

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

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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

  // Question
  questionText: text('question_text').notNull(),
  questionType: questionTypeEnum('question_type').default('open_text'),

  // Options (for multiple_choice) - JSON array
  options: jsonb('options'),

  // Position
  sequenceNumber: integer('sequence_number').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const surveyQuestionsSchema = pgTable('survey_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  blockId: uuid('block_id')
    .references(() => pageBlocksSchema.id, { onDelete: 'cascade' })
    .notNull(),

  // Question
  questionText: text('question_text').notNull(),
  questionType: questionTypeEnum('question_type').notNull(),

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
  defaultTrialDuration: integer('default_trial_duration').notNull().default(30), // days

  // AI Configuration
  defaultAiCredits: integer('default_ai_credits').notNull().default(1000),
  openaiModel: varchar('openai_model', { length: 50 }).notNull().default('gpt-4'),
  imageGenModel: varchar('image_gen_model', { length: 50 }).notNull().default('dall-e-3'),

  // Storage Configuration
  defaultStorageQuota: bigint('default_storage_quota', { mode: 'number' }).notNull().default(10737418240), // 10GB in bytes
  maxFileUploadSize: bigint('max_file_upload_size', { mode: 'number' }).notNull().default(524288000), // 500MB in bytes

  // Security Settings
  requireEmailVerification: boolean('require_email_verification').notNull().default(true),
  enableMfaForAdmins: boolean('enable_mfa_for_admins').notNull().default(true),
  sessionTimeout: integer('session_timeout').notNull().default(15), // minutes

  // Metadata
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => usersSchema.id),
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
export const quotes = quotesSchema;
export const notes = notesSchema;
export const surveyTemplates = surveyTemplatesSchema;
export const reflectionTemplates = reflectionTemplatesSchema;
export const therapeuticPrompts = therapeuticPromptsSchema;
export const scenes = scenesSchema;
export const sceneClips = sceneClipsSchema;
export const storyPages = storyPagesSchema;
export const pageBlocks = pageBlocksSchema;
export const reflectionQuestions = reflectionQuestionsSchema;
export const surveyQuestions = surveyQuestionsSchema;
export const reflectionResponses = reflectionResponsesSchema;
export const surveyResponses = surveyResponsesSchema;
export const patientPageInteractions = patientPageInteractionsSchema;
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

export type Scene = typeof scenesSchema.$inferSelect;
export type NewScene = typeof scenesSchema.$inferInsert;

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

export type AuditLog = typeof auditLogsSchema.$inferSelect;
export type NewAuditLog = typeof auditLogsSchema.$inferInsert;

export type PlatformSettings = typeof platformSettingsSchema.$inferSelect;
export type NewPlatformSettings = typeof platformSettingsSchema.$inferInsert;
