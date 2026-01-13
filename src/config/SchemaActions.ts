// Schema-to-Action Mapping Configuration
// Defines which actions are available for each JSON schema type

import type { JSONSchemaType } from '@/types/JSONSchemas';

export type SchemaAction = {
  id: string; // Unique action identifier
  label: string; // Button label text
  icon: string; // Icon name (lucide-react icon)
  handler?: string; // Handler function name in JSONActionHandlers
  callback?: string; // Callback function name (e.g., onOpenBulkSaveQuotes)
  confirmation?: string; // Optional confirmation message
  batchable?: boolean; // Whether this action processes multiple items
  destructive?: boolean; // Whether this action modifies/deletes data
};

// ============================================================================
// SCHEMA-TO-ACTION MAPPING
// ============================================================================

export const SCHEMA_ACTIONS: Record<JSONSchemaType, SchemaAction[]> = {
  // Scene Card Actions
  scene_card: [
    {
      id: 'create_scene',
      label: 'Create Scene',
      icon: 'film',
      handler: 'handleCreateScene',
      confirmation: 'This will create a new scene with the generated content.',
    },
    {
      id: 'generate_images',
      label: 'Generate Reference Images',
      icon: 'image',
      handler: 'handleGenerateImages',
      batchable: true,
    },
    {
      id: 'generate_music',
      label: 'Generate Music',
      icon: 'music',
      handler: 'handleGenerateMusic',
    },
    {
      id: 'save_reflections',
      label: 'Save Reflection Questions',
      icon: 'help-circle',
      handler: 'handleSaveReflections',
    },
  ],

  // Therapeutic Scene Card Actions
  therapeutic_scene_card: [],

  // Music Generation Actions
  music_generation: [
    {
      id: 'generate_instrumental',
      label: 'Generate Instrumental',
      icon: 'music',
      handler: 'handleGenerateInstrumental',
    },
    {
      id: 'generate_lyrical',
      label: 'Generate Lyrical Song',
      icon: 'mic',
      handler: 'handleGenerateLyrical',
    },
  ],

  // Scene Suggestions Actions
  scene_suggestions: [
    {
      id: 'create_scenes',
      label: 'Create All Scenes',
      icon: 'film',
      handler: 'handleCreateScenesFromSuggestions',
      batchable: true,
      confirmation: 'This will create multiple scenes. Continue?',
    },
    {
      id: 'save_as_notes',
      label: 'Save as Notes',
      icon: 'file-text',
      handler: 'handleSaveScenesAsNotes',
    },
  ],

  // Scene Suggestions by Quote Actions
  scene_suggestions_by_quote: [
    {
      id: 'create_scenes',
      label: 'Create All Scenes',
      icon: 'film',
      handler: 'handleCreateScenesFromSuggestions',
      batchable: true,
      confirmation: 'This will create multiple scenes. Continue?',
    },
    {
      id: 'save_as_notes',
      label: 'Save as Notes',
      icon: 'file-text',
      handler: 'handleSaveScenesAsNotes',
    },
  ],

  // Image References Actions
  image_references: [
    {
      id: 'generate_single_image',
      label: 'Generate Image',
      icon: 'image',
      handler: 'handleGenerateSingleImage',
      batchable: false,
    },
  ],

  // Video References Actions
  video_references: [
    {
      id: 'generate_single_video',
      label: 'Generate Video',
      icon: 'film',
      handler: 'handleGenerateSingleVideo',
      batchable: false,
    },
  ],

  // Reflection Questions Actions
  // Note: Saves to Therapist's template library (reusable templates)
  reflection_questions: [
    {
      id: 'save_to_template_library',
      label: 'Save to Template Library',
      icon: 'bookmark',
      handler: 'handleSaveToTemplateLibrary',
    },
  ],

  // Therapeutic Note Actions
  therapeutic_note: [
    {
      id: 'save_note',
      label: 'Save Note',
      icon: 'save',
      handler: 'handleSaveTherapeuticNote',
    },
  ],

  // Quote Extraction Actions
  quote_extraction: [
    {
      id: 'save_quotes',
      label: 'Save All Quotes',
      icon: 'quote',
      callback: 'onOpenBulkSaveQuotes',
      batchable: true,
    },
  ],

  // Extraction Schema Actions
  metaphor_extraction: [
    {
      id: 'save_metaphors',
      label: 'Save as Note',
      icon: 'save',
      handler: 'handleSaveAsNote',
    },
    {
      id: 'generate_visual',
      label: 'Generate Visual',
      icon: 'image',
      handler: 'handleGenerateVisualFromMetaphor',
    },
  ],

  key_moments: [
    {
      id: 'save_moments',
      label: 'Save as Note',
      icon: 'save',
      handler: 'handleSaveAsNote',
    },
  ],

  values_beliefs: [
    {
      id: 'save_values_beliefs',
      label: 'Save as Note',
      icon: 'save',
      handler: 'handleSaveAsNote',
    },
  ],

  goals_intentions: [
    {
      id: 'save_goals',
      label: 'Save as Note',
      icon: 'save',
      handler: 'handleSaveAsNote',
    },
  ],

  strengths_resources: [
    {
      id: 'save_strengths',
      label: 'Save as Note',
      icon: 'save',
      handler: 'handleSaveAsNote',
    },
  ],

  barriers_challenges: [
    {
      id: 'save_barriers',
      label: 'Save as Note',
      icon: 'save',
      handler: 'handleSaveAsNote',
    },
  ],

  // Visualization Schema Actions
  scene_visualization: [
    {
      id: 'generate_scene_image',
      label: 'Generate Image',
      icon: 'image',
      handler: 'handleGenerateSingleImage',
    },
    {
      id: 'save_scene_viz',
      label: 'Save as Note',
      icon: 'save',
      handler: 'handleSaveAsNote',
    },
  ],

  visual_metaphor: [
    {
      id: 'generate_metaphor_image',
      label: 'Generate Image',
      icon: 'image',
      handler: 'handleGenerateSingleImage',
    },
    {
      id: 'save_visual_metaphor',
      label: 'Save as Note',
      icon: 'save',
      handler: 'handleSaveAsNote',
    },
  ],

  story_reframe: [
    {
      id: 'save_reframe',
      label: 'Save as Note',
      icon: 'save',
      handler: 'handleSaveAsNote',
    },
    {
      id: 'add_to_story_page',
      label: 'Add to Story Page',
      icon: 'plus-circle',
      handler: 'handleAddToStoryPage',
    },
  ],

  hope_visualization: [
    {
      id: 'generate_hope_image',
      label: 'Generate Image',
      icon: 'image',
      handler: 'handleGenerateSingleImage',
    },
    {
      id: 'save_hope_viz',
      label: 'Save as Note',
      icon: 'save',
      handler: 'handleSaveAsNote',
    },
  ],

  journey_map: [
    {
      id: 'save_journey',
      label: 'Save as Note',
      icon: 'save',
      handler: 'handleSaveAsNote',
    },
    {
      id: 'generate_journey_images',
      label: 'Generate Stage Images',
      icon: 'image',
      handler: 'handleGenerateImages',
      batchable: true,
    },
  ],

  character_strength: [
    {
      id: 'generate_portrait',
      label: 'Generate Portrait',
      icon: 'image',
      handler: 'handleGenerateSingleImage',
    },
    {
      id: 'save_character',
      label: 'Save as Note',
      icon: 'save',
      handler: 'handleSaveAsNote',
    },
  ],

  timeline_visualization: [
    {
      id: 'save_timeline',
      label: 'Save as Note',
      icon: 'save',
      handler: 'handleSaveAsNote',
    },
  ],

  // Prompt Schema Actions
  journaling_prompts: [
    {
      id: 'add_journaling_prompts',
      label: 'Add to Story Page',
      icon: 'plus-circle',
      handler: 'handleAddToStoryPage',
    },
    {
      id: 'save_journaling',
      label: 'Save as Note',
      icon: 'save',
      handler: 'handleSaveAsNote',
    },
  ],

  goal_setting_questions: [
    {
      id: 'add_goal_questions',
      label: 'Add to Story Page',
      icon: 'plus-circle',
      handler: 'handleAddToStoryPage',
    },
    {
      id: 'save_goal_questions',
      label: 'Save as Note',
      icon: 'save',
      handler: 'handleSaveAsNote',
    },
  ],

  self_compassion_prompts: [
    {
      id: 'add_compassion_prompts',
      label: 'Add to Story Page',
      icon: 'plus-circle',
      handler: 'handleAddToStoryPage',
    },
    {
      id: 'save_compassion',
      label: 'Save as Note',
      icon: 'save',
      handler: 'handleSaveAsNote',
    },
  ],

  gratitude_prompts: [
    {
      id: 'add_gratitude_prompts',
      label: 'Add to Story Page',
      icon: 'plus-circle',
      handler: 'handleAddToStoryPage',
    },
    {
      id: 'save_gratitude',
      label: 'Save as Note',
      icon: 'save',
      handler: 'handleSaveAsNote',
    },
  ],

  homework_assignments: [
    {
      id: 'add_homework',
      label: 'Add to Story Page',
      icon: 'plus-circle',
      handler: 'handleAddToStoryPage',
    },
    {
      id: 'save_homework',
      label: 'Save as Note',
      icon: 'save',
      handler: 'handleSaveAsNote',
    },
  ],

  check_in_questions: [
    {
      id: 'add_checkin',
      label: 'Add to Story Page',
      icon: 'plus-circle',
      handler: 'handleAddToStoryPage',
    },
    {
      id: 'save_checkin',
      label: 'Save as Note',
      icon: 'save',
      handler: 'handleSaveAsNote',
    },
  ],

  // Combined schema actions - no bottom actions, each image card has its own button
  analysis_and_images: [],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get actions for a specific schema type
 */
export function getActionsForSchema(schemaType: JSONSchemaType): SchemaAction[] {
  return SCHEMA_ACTIONS[schemaType] || [];
}

/**
 * Get a specific action by ID and schema type
 */
export function getAction(schemaType: JSONSchemaType, actionId: string): SchemaAction | undefined {
  const actions = SCHEMA_ACTIONS[schemaType] || [];
  return actions.find(action => action.id === actionId);
}

/**
 * Check if an action is batchable
 */
export function isActionBatchable(schemaType: JSONSchemaType, actionId: string): boolean {
  const action = getAction(schemaType, actionId);
  return action?.batchable === true;
}

/**
 * Get display name for schema type (for UI)
 */
export function getSchemaDisplayName(schemaType: JSONSchemaType): string {
  const names: Record<JSONSchemaType, string> = {
    scene_card: 'Scene Card',
    therapeutic_scene_card: 'Therapeutic Scene Card',
    music_generation: 'Music Generation',
    scene_suggestions: 'Scene Suggestions',
    scene_suggestions_by_quote: 'Scene Suggestions by Quote',
    image_references: 'Image References',
    video_references: 'Video References',
    reflection_questions: 'Reflection Questions',
    therapeutic_note: 'Therapeutic Note',
    quote_extraction: 'Quote Extraction',
    // Extraction schemas
    metaphor_extraction: 'Metaphor Extraction',
    key_moments: 'Key Moments',
    values_beliefs: 'Values & Beliefs',
    goals_intentions: 'Goals & Intentions',
    strengths_resources: 'Strengths & Resources',
    barriers_challenges: 'Barriers & Challenges',
    // Visualization schemas
    scene_visualization: 'Scene Visualization',
    visual_metaphor: 'Visual Metaphor',
    story_reframe: 'Story Reframe',
    hope_visualization: 'Hope Visualization',
    journey_map: 'Journey Map',
    character_strength: 'Character Strength',
    timeline_visualization: 'Timeline Visualization',
    // Prompt schemas
    journaling_prompts: 'Journaling Prompts',
    goal_setting_questions: 'Goal-Setting Questions',
    self_compassion_prompts: 'Self-Compassion Prompts',
    gratitude_prompts: 'Gratitude Prompts',
    homework_assignments: 'Homework Assignments',
    check_in_questions: 'Check-In Questions',
    // Combined schemas
    analysis_and_images: 'Analysis & Images',
  };
  return names[schemaType] || 'JSON Output';
}

/**
 * Get schema description (for UI)
 */
export function getSchemaDescription(schemaType: JSONSchemaType): string {
  const descriptions: Record<JSONSchemaType, string> = {
    scene_card: 'A complete therapeutic scene with images, music, and reflection questions',
    therapeutic_scene_card: 'AI-generated therapeutic scene cards with patient quotes, meanings, and visual prompts',
    music_generation: 'Instrumental and lyrical music generation options',
    scene_suggestions: 'AI-suggested therapeutic scenes based on transcript analysis',
    scene_suggestions_by_quote: 'Therapeutic scene suggestions based on a specific quote',
    image_references: 'Collection of images to generate for therapeutic use',
    video_references: 'Collection of animated videos to generate for therapeutic use',
    reflection_questions: 'Curated reflection questions for patients or groups',
    therapeutic_note: 'Structured therapeutic note or observation',
    quote_extraction: 'Extracted meaningful quotes from transcript',
    // Extraction schemas
    metaphor_extraction: 'Metaphors and symbolic language identified from transcript',
    key_moments: 'Therapeutically significant moments identified from session',
    values_beliefs: 'Core values and beliefs expressed by patient',
    goals_intentions: 'Patient goals and intentions for their therapeutic journey',
    strengths_resources: 'Internal strengths and external resources available to patient',
    barriers_challenges: 'Barriers and challenges hindering progress',
    // Visualization schemas
    scene_visualization: 'Therapeutic scene with visual and symbolic elements',
    visual_metaphor: 'Visual representation of therapeutic metaphor',
    story_reframe: 'Alternative empowering narrative perspective',
    hope_visualization: 'Hopeful future vision with concrete elements',
    journey_map: 'Patient journey mapped through stages',
    character_strength: 'Character portrait highlighting core strengths',
    timeline_visualization: 'Timeline of significant life events',
    // Prompt schemas
    journaling_prompts: 'Reflective journaling prompts for patient',
    goal_setting_questions: 'Questions to clarify and develop goals',
    self_compassion_prompts: 'Prompts to cultivate self-compassion',
    gratitude_prompts: 'Prompts to practice gratitude',
    homework_assignments: 'Therapeutic assignments for between-session work',
    check_in_questions: 'Questions to assess patient progress and wellbeing',
    // Combined schemas
    analysis_and_images: 'Therapeutic analysis with image generation suggestions',
  };
  return descriptions[schemaType] || 'AI-generated structured output';
}
