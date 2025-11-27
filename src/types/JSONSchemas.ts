// JSON Schema Types for AI Assistant Structured Outputs
// These types define the structure of JSON outputs from AI prompts

export type JSONSchemaType
  = | 'scene_card'
    | 'music_generation'
    | 'scene_suggestions'
    | 'image_references'
    | 'video_references'
    | 'reflection_questions'
    | 'therapeutic_note'
    | 'quote_extraction';

export type BaseJSONSchema = {
  schemaType: JSONSchemaType;
  version?: string;
};

// ============================================================================
// SCENE CARD SCHEMA
// ============================================================================

export type SceneCardSchema = {
  schemaType: 'scene_card';
  video_introduction: string; // Patient-facing markdown introduction
  patient_reflection_questions: string[]; // Written directly to patient (using "you")
  group_reflection_questions: string[]; // For group sessions
  reference_images: Array<{
    stage_name: string; // e.g., "The Struggle", "The Realization"
    title: string; // Image title
    image_prompt: string; // Full prompt for image generation
    meaning: string; // Therapeutic meaning/interpretation
    patient_quote_anchor: string; // Quote from transcript that inspired this stage
    animation_instructions: string; // How to animate this image
  }>;
  music: {
    prompt: string; // Music generation prompt
    duration_seconds: number; // Total duration
    segment_timing?: number[]; // Optional timing for different segments
    fade_out?: boolean;
    instrument_focus?: string[]; // Primary instruments
    progression_note?: string; // How music should progress emotionally
  };
  assembly_steps: string[]; // Steps for assembling the final scene
  buttons: Array<{
    label: string; // Button text
    action: string; // Action ID (e.g., 'generate_images', 'create_scene')
    group: string; // Button group ('media', 'assembly', etc.)
    style: string; // Visual style ('primary', 'secondary')
    data_key?: string; // Optional data key reference
    icon?: string; // Icon name
  }>;
} & BaseJSONSchema;

// ============================================================================
// MUSIC GENERATION SCHEMA
// ============================================================================

export type MusicGenerationSchema = {
  schemaType: 'music_generation';
  instrumental_option: {
    music_description: string; // Description of the instrumental piece
    mood: string; // Comma-separated mood descriptors
    genre_tags: string; // Comma-separated genre tags
    title: string; // Track title
    style_prompt: string; // Single prompt for music model
    tempo_hint?: string; // Tempo description
    intensity_curve?: string; // How intensity evolves
    primary_instruments?: string; // Main instruments
    symbolic_sources: string[]; // Metaphors/symbols this expresses
    source_quotes: string[]; // PHI-free quotes from transcript
    rationale: string; // Explanation of musical choices
  };
  lyrical_option: {
    song_concept: string; // High-level song narrative
    suggested_lyrics: string; // Full draft lyrics (PHI-free)
    suggested_lyrical_themes: string[]; // Themes for inspiration
    mood: string; // Comma-separated mood descriptors
    genre_tags: string; // Comma-separated genre tags
    title: string; // Song title
    style_prompt: string; // Single prompt for music model
    vocal_feel?: string; // How vocals should sound
    perspective?: string; // Narrative perspective
    symbolic_sources: string[]; // Key metaphors
    source_quotes: string[]; // PHI-free quotes from transcript
    rationale: string; // Explanation of lyrical choices
  };
} & BaseJSONSchema;

// ============================================================================
// SCENE SUGGESTIONS SCHEMA
// ============================================================================

export type SceneSuggestionsSchema = {
  schemaType: 'scene_suggestions';
  potential_scenes_by_participant: Array<{
    for_patient_name: string; // Patient/participant name
    scenes: Array<{
      scene_title: string;
      scene_description: string;
      key_quote: string; // Meaningful quote from transcript
      therapeutic_rationale: string; // Why this scene is therapeutically relevant
      scene_focus_instruction: string; // Specific instruction for scene generation
    }>;
  }>;
} & BaseJSONSchema;

// ============================================================================
// IMAGE REFERENCES SCHEMA
// ============================================================================

export type ImageReferencesSchema = {
  schemaType: 'image_references';
  images: Array<{
    title: string;
    prompt: string; // Full image generation prompt
    style: string; // Visual style (e.g., 'photorealistic', 'painterly')
    therapeutic_purpose: string; // Why this image is therapeutically relevant
    source_quote?: string; // Optional quote that inspired the image
  }>;
} & BaseJSONSchema;

// ============================================================================
// VIDEO REFERENCES SCHEMA
// ============================================================================

export type VideoReferencesSchema = {
  schemaType: 'video_references';
  videos: Array<{
    title: string;
    prompt: string; // Full video generation prompt (what should be shown)
    reference_image_prompt?: string; // Optional: prompt for generating the starting image
    duration: number; // Duration in seconds (5-10)
    style: string; // Visual style (e.g., 'cinematic', 'realistic', 'artistic')
    therapeutic_purpose: string; // Why this video is therapeutically relevant
    source_quote?: string; // Optional quote that inspired the video
    motion_description?: string; // Description of motion/animation
  }>;
} & BaseJSONSchema;

// ============================================================================
// REFLECTION QUESTIONS SCHEMA
// ============================================================================

export type ReflectionQuestionsSchema = {
  schemaType: 'reflection_questions';
  patient_questions?: string[]; // Questions for individual reflection
  group_questions?: string[]; // Questions for group discussion
  context?: string; // Optional context for when/how to use these questions
} & BaseJSONSchema;

// ============================================================================
// THERAPEUTIC NOTE SCHEMA
// ============================================================================

export type TherapeuticNoteSchema = {
  schemaType: 'therapeutic_note';
  note_title: string;
  note_content: string; // Markdown-formatted note content
  tags?: string[]; // Optional tags for categorization
  key_themes?: string[]; // Key therapeutic themes
  action_items?: string[]; // Optional follow-up actions
} & BaseJSONSchema;

// ============================================================================
// QUOTE EXTRACTION SCHEMA
// ============================================================================

export type QuoteExtractionSchema = {
  schemaType: 'quote_extraction';
  extracted_quotes?: Array<{
    quote_text: string;
    speaker: string; // Speaker name or type
    context: string; // Why this quote is significant
    tags?: string[]; // Optional tags
    timestamp?: {
      start: number; // Start time in seconds
      end: number; // End time in seconds
    };
  }>;
  quotes?: Array<{
    // Alternative structure (for compatibility)
    text: string;
    speaker: string;
    significance: string;
    tags?: string[];
  }>;
} & BaseJSONSchema;

// ============================================================================
// UNION TYPE FOR ALL SCHEMAS
// ============================================================================

export type AnyJSONSchema
  = | SceneCardSchema
    | MusicGenerationSchema
    | SceneSuggestionsSchema
    | ImageReferencesSchema
    | VideoReferencesSchema
    | ReflectionQuestionsSchema
    | TherapeuticNoteSchema
    | QuoteExtractionSchema;

// ============================================================================
// HELPER TYPE GUARDS
// ============================================================================

export function isSceneCardSchema(schema: any): schema is SceneCardSchema {
  return schema?.schemaType === 'scene_card';
}

export function isMusicGenerationSchema(schema: any): schema is MusicGenerationSchema {
  return schema?.schemaType === 'music_generation';
}

export function isSceneSuggestionsSchema(schema: any): schema is SceneSuggestionsSchema {
  return schema?.schemaType === 'scene_suggestions';
}

export function isImageReferencesSchema(schema: any): schema is ImageReferencesSchema {
  return schema?.schemaType === 'image_references';
}

export function isReflectionQuestionsSchema(schema: any): schema is ReflectionQuestionsSchema {
  return schema?.schemaType === 'reflection_questions';
}

export function isTherapeuticNoteSchema(schema: any): schema is TherapeuticNoteSchema {
  return schema?.schemaType === 'therapeutic_note';
}

export function isVideoReferencesSchema(schema: any): schema is VideoReferencesSchema {
  return schema?.schemaType === 'video_references';
}

export function isQuoteExtractionSchema(schema: any): schema is QuoteExtractionSchema {
  return schema?.schemaType === 'quote_extraction';
}
