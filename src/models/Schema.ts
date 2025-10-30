import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  decimal,
  bigint,
} from 'drizzle-orm/pg-core';

// StoryCare Database Schema
// Digital Therapeutic Platform for Narrative Therapy

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum('user_role', ['therapist', 'patient', 'admin']);
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

// ============================================================================
// USERS & AUTHENTICATION
// ============================================================================

export const usersSchema = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull(),
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
});

// ============================================================================
// GROUPS & GROUP MEMBERS
// ============================================================================

export const groupsSchema = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
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
// MEDIA LIBRARY
// ============================================================================

export const mediaLibrarySchema = pgTable('media_library', {
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

  // Tags (array of strings)
  tags: text('tags').array(),

  // Status
  status: mediaStatusEnum('status').default('completed'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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
  thumbnailUrl: text('thumbnail_url'),
  durationSeconds: integer('duration_seconds'),

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
// EXPORTS (for type inference)
// ============================================================================

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

export type MediaLibrary = typeof mediaLibrarySchema.$inferSelect;
export type NewMediaLibrary = typeof mediaLibrarySchema.$inferInsert;

export type Quote = typeof quotesSchema.$inferSelect;
export type NewQuote = typeof quotesSchema.$inferInsert;

export type Note = typeof notesSchema.$inferSelect;
export type NewNote = typeof notesSchema.$inferInsert;

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
