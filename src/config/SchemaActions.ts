// Schema-to-Action Mapping Configuration
// Defines which actions are available for each JSON schema type

import type { JSONSchemaType } from '@/types/JSONSchemas';

export type SchemaAction = {
  id: string; // Unique action identifier
  label: string; // Button label text
  icon: string; // Icon name (lucide-react icon)
  handler: string; // Handler function name in JSONActionHandlers
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
  reflection_questions: [
    {
      id: 'add_to_module',
      label: 'Add to Module',
      icon: 'plus-circle',
      handler: 'handleAddReflectionsToModule',
    },
    {
      id: 'save_as_note',
      label: 'Save as Note',
      icon: 'file-text',
      handler: 'handleSaveAsNote',
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
      handler: 'handleSaveQuotes',
      batchable: true,
    },
  ],
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
    music_generation: 'Music Generation',
    scene_suggestions: 'Scene Suggestions',
    image_references: 'Image References',
    video_references: 'Video References',
    reflection_questions: 'Reflection Questions',
    therapeutic_note: 'Therapeutic Note',
    quote_extraction: 'Quote Extraction',
  };
  return names[schemaType] || 'JSON Output';
}

/**
 * Get schema description (for UI)
 */
export function getSchemaDescription(schemaType: JSONSchemaType): string {
  const descriptions: Record<JSONSchemaType, string> = {
    scene_card: 'A complete therapeutic scene with images, music, and reflection questions',
    music_generation: 'Instrumental and lyrical music generation options',
    scene_suggestions: 'AI-suggested therapeutic scenes based on transcript analysis',
    image_references: 'Collection of images to generate for therapeutic use',
    video_references: 'Collection of animated videos to generate for therapeutic use',
    reflection_questions: 'Curated reflection questions for patients or groups',
    therapeutic_note: 'Structured therapeutic note or observation',
    quote_extraction: 'Extracted meaningful quotes from transcript',
  };
  return descriptions[schemaType] || 'AI-generated structured output';
}
