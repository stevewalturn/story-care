// JSON Schema Types for AI Assistant Structured Outputs
// These types define the structure of JSON outputs from AI prompts

export type JSONSchemaType
  = | 'scene_card'
    | 'therapeutic_scene_card'
    | 'music_generation'
    | 'scene_suggestions'
    | 'image_references'
    | 'video_references'
    | 'reflection_questions'
    | 'therapeutic_note'
    | 'quote_extraction'
    // Extraction schemas
    | 'metaphor_extraction'
    | 'key_moments'
    | 'values_beliefs'
    | 'goals_intentions'
    | 'strengths_resources'
    | 'barriers_challenges'
    // Visualization schemas
    | 'scene_visualization'
    | 'visual_metaphor'
    | 'story_reframe'
    | 'hope_visualization'
    | 'journey_map'
    | 'character_strength'
    | 'timeline_visualization'
    // Prompt schemas
    | 'journaling_prompts'
    | 'goal_setting_questions'
    | 'self_compassion_prompts'
    | 'gratitude_prompts'
    | 'homework_assignments'
    | 'check_in_questions';

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
// THERAPEUTIC SCENE CARD SCHEMA
// ============================================================================

export type TherapeuticSceneCardSchema = {
  schemaType: 'therapeutic_scene_card';
  type: 'therapeutic_scene_card';
  title: string; // e.g., "Therapeutic Scene Card"
  subtitle?: string; // e.g., "References images & animation"
  patient: string; // Patient name
  scenes: Array<{
    sceneNumber: number;
    sections: {
      patientQuote: {
        label: string; // "Patient Quote Anchor"
        content: string; // Actual quote
      };
      meaning: {
        label: string; // "Meaning"
        content: string; // Therapeutic significance
      };
      imagePrompt: {
        label: string; // "Image prompt"
        content: string; // Detailed image generation prompt
      };
      imageToScene: {
        label: string; // "Image to scene"
        content: string; // Animation/scene direction
      };
    };
  }>;
  status: 'pending' | 'completed';
} & BaseJSONSchema;

// ============================================================================
// MUSIC GENERATION SCHEMA
// ============================================================================

export type MusicGenerationSchema = {
  schemaType: 'music_generation';
  instrumental_option: {
    music_description: string; // Description of the instrumental piece
    mood: string; // Comma-separated mood descriptors
    genre_tags: string[]; // Array of genre tags (changed from string)
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
    genre_tags: string[]; // Array of genre tags (changed from string)
    title: string; // Song title
    style_prompt: string; // Single prompt for music model
    vocal_feel?: string; // How vocals should sound
    perspective?: string; // Narrative perspective
    symbolic_sources: string[]; // Key metaphors
    source_quotes: string[]; // PHI-free quotes from transcript
    rationale: string; // Explanation of lyrical choices
    music_description?: string; // Description of the vocal piece (added missing field)
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
    // Rich perspective card fields (optional for backward compatibility)
    timestamp?: string; // e.g., "14:32"
    sequenceNumber?: number; // e.g., 4
    speaker?: string; // e.g., "Patient"
    conceptDescription?: string; // Longer explanation of image concept
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
// EXTRACTION SCHEMAS
// ============================================================================

export type MetaphorExtractionSchema = {
  schemaType: 'metaphor_extraction';
  metaphors: Array<{
    metaphor: string; // The metaphor or symbolic language used
    literal_meaning: string; // What it represents literally
    symbolic_meaning: string; // What it represents symbolically/therapeutically
    quote: string; // Exact quote containing the metaphor
    speaker: string; // Who said it
    therapeutic_significance: string; // Why this metaphor matters
  }>;
  summary?: string; // Optional summary of metaphorical themes
} & BaseJSONSchema;

export type KeyMomentsSchema = {
  schemaType: 'key_moments';
  moments: Array<{
    timestamp?: string; // Optional timestamp
    moment_title: string; // Brief title for this moment
    description: string; // What happened in this moment
    significance: string; // Why this moment is therapeutically significant
    emotions?: string[]; // Emotions present
    themes?: string[]; // Therapeutic themes
    quote?: string; // Key quote from this moment
  }>;
} & BaseJSONSchema;

export type ValuesBeliefsSchema = {
  schemaType: 'values_beliefs';
  values: Array<{
    value: string; // Core value identified
    evidence: string[]; // Evidence from transcript
    strength: 'core' | 'emerging' | 'conflicted'; // How strongly held
  }>;
  beliefs: Array<{
    belief: string; // Belief identified
    type: 'empowering' | 'limiting' | 'neutral'; // Type of belief
    evidence: string[]; // Evidence from transcript
    impact?: string; // How this belief affects the patient
  }>;
  alignment_notes?: string; // Notes about value-belief alignment
} & BaseJSONSchema;

export type GoalsIntentionsSchema = {
  schemaType: 'goals_intentions';
  goals: Array<{
    goal: string; // The goal stated
    category: 'stated' | 'implied' | 'emerging'; // How the goal was expressed
    timeframe?: string; // When they want to achieve it
    barriers?: string[]; // Identified barriers
    resources?: string[]; // Resources they have
    quote?: string; // Quote expressing this goal
  }>;
  intentions: Array<{
    intention: string; // The intention
    context: string; // Context in which it was expressed
    alignment_with_values?: string; // How it aligns with their values
  }>;
} & BaseJSONSchema;

export type StrengthsResourcesSchema = {
  schemaType: 'strengths_resources';
  internal_strengths: Array<{
    strength: string; // Internal strength or quality
    evidence: string[]; // Examples from transcript
    how_used?: string; // How they currently use this strength
  }>;
  external_resources: Array<{
    resource: string; // External support or resource
    type: 'social' | 'material' | 'professional' | 'community'; // Type of resource
    accessibility: 'available' | 'limited' | 'untapped'; // How accessible it is
    evidence?: string; // Evidence from transcript
  }>;
  underutilized?: string[]; // Strengths/resources not being fully used
} & BaseJSONSchema;

export type BarriersChallengesSchema = {
  schemaType: 'barriers_challenges';
  barriers: Array<{
    barrier: string; // The barrier or challenge
    type: 'internal' | 'external' | 'systemic'; // Type of barrier
    impact: 'high' | 'medium' | 'low'; // Impact on progress
    evidence: string; // Evidence from transcript
    potential_interventions?: string[]; // Possible ways to address
  }>;
  patterns?: string; // Patterns in how barriers manifest
  priority_challenges?: string[]; // Most urgent challenges to address
} & BaseJSONSchema;

// ============================================================================
// VISUALIZATION SCHEMAS
// ============================================================================

export type SceneVisualizationSchema = {
  schemaType: 'scene_visualization';
  title: string; // Scene title
  description: string; // Detailed scene description
  dalle_prompt: string; // Complete DALL-E image generation prompt
  mood: string; // Emotional tone
  symbolic_elements: string[]; // Symbols present in the scene
  therapeutic_purpose: string; // Why this scene matters therapeutically
  color_palette?: string[]; // Suggested colors
  lighting?: string; // Lighting description
} & BaseJSONSchema;

export type VisualMetaphorSchema = {
  schemaType: 'visual_metaphor';
  metaphor_title: string; // Title of the visual metaphor
  metaphor_description: string; // What the metaphor represents
  image_prompt: string; // Complete image generation prompt
  symbolic_meaning: string; // What the visual symbolizes
  therapeutic_connection: string; // How it connects to patient's journey
  source_quote?: string; // Quote that inspired this
  visual_elements: string[]; // Key visual elements to include
} & BaseJSONSchema;

export type StoryReframeSchema = {
  schemaType: 'story_reframe';
  original_narrative: string; // How patient currently views their story
  reframed_narrative: string; // Alternative, empowering narrative
  key_shifts: Array<{
    from: string; // Old perspective
    to: string; // New perspective
    evidence: string; // Support for the reframe
  }>;
  bridging_questions?: string[]; // Questions to help patient move to reframe
  visual_representation?: string; // Optional: visual prompt for the reframe
} & BaseJSONSchema;

export type HopeVisualizationSchema = {
  schemaType: 'hope_visualization';
  hope_title: string; // Title for the hope visualization
  hope_description: string; // Description of the hopeful future
  image_prompt: string; // Image generation prompt showing hope
  concrete_elements: string[]; // Concrete elements of the hopeful vision
  path_forward?: string[]; // Steps toward this hopeful future
  affirmation?: string; // Optional affirmation statement
  source_strengths?: string[]; // Strengths that support this hope
} & BaseJSONSchema;

export type JourneyMapSchema = {
  schemaType: 'journey_map';
  journey_title: string; // Title of the journey
  stages: Array<{
    stage_name: string; // Name of this stage
    description: string; // What characterized this stage
    key_events?: string[]; // Key events in this stage
    emotions: string[]; // Dominant emotions
    learnings?: string; // What was learned
    visual_prompt?: string; // Optional: image prompt for this stage
  }>;
  current_stage?: string; // Where they are now
  next_steps?: string[]; // Potential next steps
} & BaseJSONSchema;

export type CharacterStrengthSchema = {
  schemaType: 'character_strength';
  portrait_title: string; // Title for the character portrait
  core_strengths: Array<{
    strength: string; // Character strength
    manifestation: string; // How it shows up
    evidence: string[]; // Examples from transcript
  }>;
  growth_areas?: string[]; // Areas for development
  visual_prompt: string; // Image prompt for character portrait
  narrative_summary: string; // Narrative summary of their character
  archetypal_elements?: string[]; // Archetypal qualities present
} & BaseJSONSchema;

export type TimelineVisualizationSchema = {
  schemaType: 'timeline_visualization';
  timeline_title: string; // Title for the timeline
  timeline_entries: Array<{
    date?: string; // Optional date
    event: string; // What happened
    significance: string; // Why it matters
    emotional_tone: string; // Emotional quality
    connections?: string[]; // Connections to other events
  }>;
  visual_style?: string; // How to visualize (linear, spiral, branching)
  key_turning_points?: string[]; // Most significant moments
} & BaseJSONSchema;

// ============================================================================
// PROMPT SCHEMAS
// ============================================================================

export type JournalingPromptsSchema = {
  schemaType: 'journaling_prompts';
  prompts: Array<{
    prompt: string; // The journaling prompt
    focus: string; // What this prompt explores
    optional_guidance?: string; // Optional guidance for using the prompt
  }>;
  context?: string; // Context for when to use these prompts
  duration_suggestion?: string; // Suggested time to spend
} & BaseJSONSchema;

export type GoalSettingQuestionsSchema = {
  schemaType: 'goal_setting_questions';
  questions: Array<{
    question: string; // The goal-setting question
    category: 'clarification' | 'planning' | 'motivation' | 'barriers'; // Category
    follow_up?: string; // Optional follow-up question
  }>;
  goal_context?: string; // Context about the goal area
} & BaseJSONSchema;

export type SelfCompassionPromptsSchema = {
  schemaType: 'self_compassion_prompts';
  prompts: Array<{
    prompt: string; // The self-compassion prompt
    technique: string; // Technique used (self-talk, reframe, etc.)
    when_to_use?: string; // When this prompt is most helpful
  }>;
  introduction?: string; // Optional introduction to self-compassion
} & BaseJSONSchema;

export type GratitudePromptsSchema = {
  schemaType: 'gratitude_prompts';
  prompts: Array<{
    prompt: string; // The gratitude prompt
    focus_area?: string; // What area of life it focuses on
    depth: 'surface' | 'moderate' | 'deep'; // Depth of reflection
  }>;
  practice_suggestion?: string; // How to practice gratitude
} & BaseJSONSchema;

export type HomeworkAssignmentsSchema = {
  schemaType: 'homework_assignments';
  assignments: Array<{
    assignment: string; // The homework task
    purpose: string; // Why this assignment
    instructions: string[]; // Step-by-step instructions
    time_required?: string; // Estimated time
    materials_needed?: string[]; // What they need
    success_criteria?: string; // How to know it's done well
  }>;
  general_guidance?: string; // General guidance for all assignments
} & BaseJSONSchema;

export type CheckInQuestionsSchema = {
  schemaType: 'check_in_questions';
  questions: Array<{
    question: string; // The check-in question
    type: 'scale' | 'open' | 'multiple_choice'; // Question type
    options?: string[]; // For multiple choice
    scale_range?: { min: number; max: number; labels?: string[] }; // For scale questions
    purpose?: string; // What this assesses
  }>;
  check_in_context?: string; // When/how to use these
  frequency_suggestion?: string; // How often to check in
} & BaseJSONSchema;

// ============================================================================
// UNION TYPE FOR ALL SCHEMAS
// ============================================================================

export type AnyJSONSchema
  = | SceneCardSchema
    | TherapeuticSceneCardSchema
    | MusicGenerationSchema
    | SceneSuggestionsSchema
    | ImageReferencesSchema
    | VideoReferencesSchema
    | ReflectionQuestionsSchema
    | TherapeuticNoteSchema
    | QuoteExtractionSchema
    // Extraction schemas
    | MetaphorExtractionSchema
    | KeyMomentsSchema
    | ValuesBeliefsSchema
    | GoalsIntentionsSchema
    | StrengthsResourcesSchema
    | BarriersChallengesSchema
    // Visualization schemas
    | SceneVisualizationSchema
    | VisualMetaphorSchema
    | StoryReframeSchema
    | HopeVisualizationSchema
    | JourneyMapSchema
    | CharacterStrengthSchema
    | TimelineVisualizationSchema
    // Prompt schemas
    | JournalingPromptsSchema
    | GoalSettingQuestionsSchema
    | SelfCompassionPromptsSchema
    | GratitudePromptsSchema
    | HomeworkAssignmentsSchema
    | CheckInQuestionsSchema;

// ============================================================================
// HELPER TYPE GUARDS
// ============================================================================

export function isSceneCardSchema(schema: any): schema is SceneCardSchema {
  return schema?.schemaType === 'scene_card';
}

export function isTherapeuticSceneCardSchema(schema: any): schema is TherapeuticSceneCardSchema {
  return schema?.schemaType === 'therapeutic_scene_card';
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

// Extraction schema type guards
export function isMetaphorExtractionSchema(schema: any): schema is MetaphorExtractionSchema {
  return schema?.schemaType === 'metaphor_extraction';
}

export function isKeyMomentsSchema(schema: any): schema is KeyMomentsSchema {
  return schema?.schemaType === 'key_moments';
}

export function isValuesBeliefsSchema(schema: any): schema is ValuesBeliefsSchema {
  return schema?.schemaType === 'values_beliefs';
}

export function isGoalsIntentionsSchema(schema: any): schema is GoalsIntentionsSchema {
  return schema?.schemaType === 'goals_intentions';
}

export function isStrengthsResourcesSchema(schema: any): schema is StrengthsResourcesSchema {
  return schema?.schemaType === 'strengths_resources';
}

export function isBarriersChallengesSchema(schema: any): schema is BarriersChallengesSchema {
  return schema?.schemaType === 'barriers_challenges';
}

// Visualization schema type guards
export function isSceneVisualizationSchema(schema: any): schema is SceneVisualizationSchema {
  return schema?.schemaType === 'scene_visualization';
}

export function isVisualMetaphorSchema(schema: any): schema is VisualMetaphorSchema {
  return schema?.schemaType === 'visual_metaphor';
}

export function isStoryReframeSchema(schema: any): schema is StoryReframeSchema {
  return schema?.schemaType === 'story_reframe';
}

export function isHopeVisualizationSchema(schema: any): schema is HopeVisualizationSchema {
  return schema?.schemaType === 'hope_visualization';
}

export function isJourneyMapSchema(schema: any): schema is JourneyMapSchema {
  return schema?.schemaType === 'journey_map';
}

export function isCharacterStrengthSchema(schema: any): schema is CharacterStrengthSchema {
  return schema?.schemaType === 'character_strength';
}

export function isTimelineVisualizationSchema(schema: any): schema is TimelineVisualizationSchema {
  return schema?.schemaType === 'timeline_visualization';
}

// Prompt schema type guards
export function isJournalingPromptsSchema(schema: any): schema is JournalingPromptsSchema {
  return schema?.schemaType === 'journaling_prompts';
}

export function isGoalSettingQuestionsSchema(schema: any): schema is GoalSettingQuestionsSchema {
  return schema?.schemaType === 'goal_setting_questions';
}

export function isSelfCompassionPromptsSchema(schema: any): schema is SelfCompassionPromptsSchema {
  return schema?.schemaType === 'self_compassion_prompts';
}

export function isGratitudePromptsSchema(schema: any): schema is GratitudePromptsSchema {
  return schema?.schemaType === 'gratitude_prompts';
}

export function isHomeworkAssignmentsSchema(schema: any): schema is HomeworkAssignmentsSchema {
  return schema?.schemaType === 'homework_assignments';
}

export function isCheckInQuestionsSchema(schema: any): schema is CheckInQuestionsSchema {
  return schema?.schemaType === 'check_in_questions';
}
