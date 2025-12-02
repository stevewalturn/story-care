/**
 * Building Block Definitions
 *
 * This file contains the complete definitions for all available building blocks
 * that therapists can use to create structured AI prompts.
 */

import type { BuildingBlock, BlockType, ValidationRule } from '@/types/BuildingBlocks';

/**
 * Complete registry of all building block definitions
 */
export const BLOCK_DEFINITIONS: Record<BlockType, BuildingBlock> = {
  /**
   * IMAGE PROMPT BLOCK
   * For generating therapeutic images
   */
  image_prompt: {
    id: 'image_prompt',
    type: 'image_prompt',
    label: 'Image Prompt',
    icon: 'image',
    category: 'media',
    description: 'Generate an image based on therapeutic context',
    fields: [
      {
        id: 'title',
        label: 'Image Title',
        type: 'text',
        required: true,
        placeholder: 'e.g., Strength Visualization, Peaceful Landscape',
        validation: {
          minLength: 3,
          maxLength: 100,
        },
        helpText: 'A descriptive title for this image',
      },
      {
        id: 'prompt',
        label: 'Generation Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the image in detail. What should it depict? What mood should it convey?',
        validation: {
          minLength: 20,
          maxLength: 1000,
        },
        helpText: 'Detailed description for AI image generation',
      },
      {
        id: 'therapeutic_purpose',
        label: 'Therapeutic Purpose',
        type: 'textarea',
        required: false,
        placeholder: 'Why is this image meaningful for the patient? What therapeutic goal does it support?',
        validation: {
          maxLength: 500,
        },
        helpText: 'Explain the therapeutic significance',
      },
      {
        id: 'style',
        label: 'Style Preference',
        type: 'select',
        required: false,
        defaultValue: 'photorealistic',
        options: [
          { label: 'Photorealistic', value: 'photorealistic' },
          { label: 'Artistic/Painting', value: 'artistic' },
          { label: 'Abstract', value: 'abstract' },
          { label: 'Watercolor', value: 'watercolor' },
          { label: 'Digital Art', value: 'digital' },
          { label: 'Sketch/Drawing', value: 'sketch' },
        ],
        helpText: 'Visual style for the generated image',
      },
    ],
    outputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        prompt: { type: 'string' },
        therapeutic_purpose: { type: 'string' },
        style: { type: 'string' },
      },
      required: ['title', 'prompt'],
    },
  },

  /**
   * VIDEO PROMPT BLOCK
   * For generating therapeutic videos
   */
  video_prompt: {
    id: 'video_prompt',
    type: 'video_prompt',
    label: 'Video Prompt',
    icon: 'video',
    category: 'media',
    description: 'Generate a video based on therapeutic narrative',
    fields: [
      {
        id: 'title',
        label: 'Video Title',
        type: 'text',
        required: true,
        placeholder: 'e.g., Journey Through Healing, Moment of Breakthrough',
        validation: {
          minLength: 3,
          maxLength: 100,
        },
      },
      {
        id: 'prompt',
        label: 'Generation Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the video scene. What happens? What emotions should it convey?',
        validation: {
          minLength: 20,
          maxLength: 1000,
        },
      },
      {
        id: 'therapeutic_purpose',
        label: 'Therapeutic Purpose',
        type: 'textarea',
        required: false,
        placeholder: 'How does this video support the patient\'s therapeutic goals?',
        validation: {
          maxLength: 500,
        },
      },
      {
        id: 'duration',
        label: 'Duration (seconds)',
        type: 'number',
        required: false,
        defaultValue: 5,
        validation: {
          min: 3,
          max: 10,
        },
        helpText: 'Video length (3-10 seconds)',
      },
      {
        id: 'style',
        label: 'Visual Style',
        type: 'select',
        required: false,
        defaultValue: 'cinematic',
        options: [
          { label: 'Cinematic', value: 'cinematic' },
          { label: 'Documentary', value: 'documentary' },
          { label: 'Artistic', value: 'artistic' },
          { label: 'Abstract', value: 'abstract' },
        ],
      },
    ],
    outputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        prompt: { type: 'string' },
        therapeutic_purpose: { type: 'string' },
        duration: { type: 'number' },
        style: { type: 'string' },
      },
      required: ['title', 'prompt'],
    },
  },

  /**
   * MUSIC GENERATION BLOCK
   * For generating therapeutic music
   */
  music_generation: {
    id: 'music_generation',
    type: 'music_generation',
    label: 'Music Generation',
    icon: 'music',
    category: 'media',
    description: 'Generate therapeutic music (instrumental or with lyrics)',
    fields: [
      {
        id: 'type',
        label: 'Music Type',
        type: 'select',
        required: true,
        defaultValue: 'instrumental',
        options: [
          { label: 'Instrumental Only', value: 'instrumental' },
          { label: 'Song with Lyrics', value: 'lyrical' },
        ],
      },
      {
        id: 'title',
        label: 'Song Title',
        type: 'text',
        required: true,
        placeholder: 'e.g., Healing Journey, Inner Strength',
        validation: {
          minLength: 3,
          maxLength: 100,
        },
      },
      {
        id: 'style',
        label: 'Musical Style',
        type: 'select',
        required: true,
        options: [
          { label: 'Ambient', value: 'ambient' },
          { label: 'Classical', value: 'classical' },
          { label: 'Acoustic', value: 'acoustic' },
          { label: 'Cinematic', value: 'cinematic' },
          { label: 'Folk', value: 'folk' },
          { label: 'Jazz', value: 'jazz' },
          { label: 'Electronic', value: 'electronic' },
        ],
      },
      {
        id: 'mood',
        label: 'Mood',
        type: 'select',
        required: true,
        options: [
          { label: 'Calm & Peaceful', value: 'calm' },
          { label: 'Uplifting & Hopeful', value: 'uplifting' },
          { label: 'Reflective & Contemplative', value: 'reflective' },
          { label: 'Energetic & Motivating', value: 'energetic' },
          { label: 'Melancholic & Healing', value: 'melancholic' },
        ],
      },
      {
        id: 'tempo',
        label: 'Tempo',
        type: 'select',
        required: false,
        defaultValue: 'medium',
        options: [
          { label: 'Slow', value: 'slow' },
          { label: 'Medium', value: 'medium' },
          { label: 'Fast', value: 'fast' },
        ],
      },
      {
        id: 'lyrics',
        label: 'Lyrics/Theme',
        type: 'textarea',
        required: false,
        placeholder: 'If lyrical, describe the themes or provide actual lyrics...',
        validation: {
          maxLength: 1000,
        },
        helpText: 'Only needed for lyrical songs',
      },
    ],
    outputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['instrumental', 'lyrical'] },
        title: { type: 'string' },
        style: { type: 'string' },
        mood: { type: 'string' },
        tempo: { type: 'string' },
        lyrics: { type: 'string' },
      },
      required: ['type', 'title', 'style', 'mood'],
    },
  },

  /**
   * VIDEO INTRODUCTION BLOCK
   * For scene card video introductions
   */
  video_introduction: {
    id: 'video_introduction',
    type: 'video_introduction',
    label: 'Video Introduction',
    icon: 'play-circle',
    category: 'structure',
    description: 'Opening video for a therapeutic scene',
    fields: [
      {
        id: 'title',
        label: 'Introduction Title',
        type: 'text',
        required: true,
        placeholder: 'e.g., Scene Introduction, Welcome',
      },
      {
        id: 'prompt',
        label: 'Video Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the opening video...',
        validation: {
          minLength: 20,
          maxLength: 500,
        },
      },
      {
        id: 'duration',
        label: 'Duration (seconds)',
        type: 'number',
        required: false,
        defaultValue: 5,
        validation: {
          min: 3,
          max: 10,
        },
      },
    ],
    outputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        prompt: { type: 'string' },
        duration: { type: 'number' },
      },
      required: ['title', 'prompt'],
    },
  },

  /**
   * QUOTE EXTRACTION BLOCK
   * For extracting meaningful quotes from transcripts
   */
  quote: {
    id: 'quote',
    type: 'quote',
    label: 'Quote Extraction',
    icon: 'quote',
    category: 'content',
    description: 'Extract meaningful quotes with context',
    fields: [
      {
        id: 'extract_speaker',
        label: 'Extract Speaker',
        type: 'boolean',
        required: false,
        defaultValue: true,
        helpText: 'Include who said the quote',
      },
      {
        id: 'extract_context',
        label: 'Extract Context',
        type: 'boolean',
        required: false,
        defaultValue: true,
        helpText: 'Include surrounding context',
      },
      {
        id: 'extract_timestamp',
        label: 'Extract Timestamp',
        type: 'boolean',
        required: false,
        defaultValue: true,
        helpText: 'Include when it was said',
      },
      {
        id: 'therapeutic_significance',
        label: 'Analyze Therapeutic Significance',
        type: 'boolean',
        required: false,
        defaultValue: true,
        helpText: 'Explain why each quote is therapeutically meaningful',
      },
      {
        id: 'max_quotes',
        label: 'Maximum Quotes',
        type: 'number',
        required: false,
        defaultValue: 5,
        validation: {
          min: 1,
          max: 20,
        },
      },
    ],
    outputSchema: {
      type: 'object',
      properties: {
        extract_speaker: { type: 'boolean' },
        extract_context: { type: 'boolean' },
        extract_timestamp: { type: 'boolean' },
        therapeutic_significance: { type: 'boolean' },
        max_quotes: { type: 'number' },
      },
    },
  },

  /**
   * THERAPEUTIC NOTE BLOCK
   * For structured therapeutic notes
   */
  therapeutic_note: {
    id: 'therapeutic_note',
    type: 'therapeutic_note',
    label: 'Therapeutic Note',
    icon: 'file-text',
    category: 'content',
    description: 'Create structured therapeutic notes',
    fields: [
      {
        id: 'title_prompt',
        label: 'Note Title Guidance',
        type: 'text',
        required: false,
        placeholder: 'How should the note be titled?',
        helpText: 'Optional guidance for AI to generate the title',
      },
      {
        id: 'include_tags',
        label: 'Include Tags',
        type: 'boolean',
        required: false,
        defaultValue: true,
        helpText: 'Generate relevant tags',
      },
      {
        id: 'include_themes',
        label: 'Include Themes',
        type: 'boolean',
        required: false,
        defaultValue: true,
        helpText: 'Identify key therapeutic themes',
      },
      {
        id: 'include_action_items',
        label: 'Include Action Items',
        type: 'boolean',
        required: false,
        defaultValue: false,
        helpText: 'Suggest follow-up actions',
      },
      {
        id: 'content_focus',
        label: 'Content Focus',
        type: 'textarea',
        required: false,
        placeholder: 'What should the note focus on? Any specific areas to highlight?',
      },
    ],
    outputSchema: {
      type: 'object',
      properties: {
        title_prompt: { type: 'string' },
        include_tags: { type: 'boolean' },
        include_themes: { type: 'boolean' },
        include_action_items: { type: 'boolean' },
        content_focus: { type: 'string' },
      },
    },
  },

  /**
   * SCENE SUGGESTION BLOCK
   * For suggesting therapeutic scenes
   */
  scene_suggestion: {
    id: 'scene_suggestion',
    type: 'scene_suggestion',
    label: 'Scene Suggestion',
    icon: 'film',
    category: 'content',
    description: 'Suggest scenes for video assembly',
    fields: [
      {
        id: 'participant_name',
        label: 'Participant Name',
        type: 'text',
        required: false,
        placeholder: 'Optional: Focus on a specific participant',
      },
      {
        id: 'scene_criteria',
        label: 'Scene Criteria',
        type: 'textarea',
        required: false,
        placeholder: 'What makes a moment scene-worthy? Emotional shifts, breakthroughs, metaphors?',
        validation: {
          maxLength: 500,
        },
      },
      {
        id: 'max_scenes',
        label: 'Maximum Scenes',
        type: 'number',
        required: false,
        defaultValue: 3,
        validation: {
          min: 1,
          max: 10,
        },
      },
    ],
    outputSchema: {
      type: 'object',
      properties: {
        participant_name: { type: 'string' },
        scene_criteria: { type: 'string' },
        max_scenes: { type: 'number' },
      },
    },
  },

  /**
   * REFLECTION QUESTION BLOCK
   * For patient reflection questions
   */
  reflection_question: {
    id: 'reflection_question',
    type: 'reflection_question',
    label: 'Reflection Question',
    icon: 'help-circle',
    category: 'interaction',
    description: 'Generate reflection questions for patients',
    fields: [
      {
        id: 'question_type',
        label: 'Question Type',
        type: 'select',
        required: true,
        defaultValue: 'patient',
        options: [
          { label: 'Individual Patient', value: 'patient' },
          { label: 'Group Discussion', value: 'group' },
        ],
      },
      {
        id: 'focus_area',
        label: 'Focus Area',
        type: 'textarea',
        required: false,
        placeholder: 'What should the questions explore? Emotions, relationships, goals?',
        validation: {
          maxLength: 300,
        },
      },
      {
        id: 'therapeutic_purpose',
        label: 'Therapeutic Purpose',
        type: 'textarea',
        required: false,
        placeholder: 'What therapeutic goal do these questions support?',
        validation: {
          maxLength: 300,
        },
      },
      {
        id: 'num_questions',
        label: 'Number of Questions',
        type: 'number',
        required: false,
        defaultValue: 3,
        validation: {
          min: 1,
          max: 10,
        },
      },
    ],
    outputSchema: {
      type: 'object',
      properties: {
        question_type: { type: 'string', enum: ['patient', 'group'] },
        focus_area: { type: 'string' },
        therapeutic_purpose: { type: 'string' },
        num_questions: { type: 'number' },
      },
      required: ['question_type'],
    },
  },

  /**
   * SURVEY QUESTION BLOCK
   * For patient surveys
   */
  survey_question: {
    id: 'survey_question',
    type: 'survey_question',
    label: 'Survey Question',
    icon: 'list-checks',
    category: 'interaction',
    description: 'Create survey questions for patient feedback',
    fields: [
      {
        id: 'question_text',
        label: 'Question Text',
        type: 'textarea',
        required: true,
        placeholder: 'Enter the survey question...',
        validation: {
          minLength: 10,
          maxLength: 500,
        },
      },
      {
        id: 'question_type',
        label: 'Response Type',
        type: 'select',
        required: true,
        defaultValue: 'text',
        options: [
          { label: 'Text Response', value: 'text' },
          { label: 'Multiple Choice', value: 'multiple_choice' },
          { label: 'Rating Scale', value: 'rating' },
        ],
      },
      {
        id: 'options',
        label: 'Options (for multiple choice)',
        type: 'textarea',
        required: false,
        placeholder: 'Enter options, one per line',
        helpText: 'Only needed for multiple choice questions',
      },
      {
        id: 'required',
        label: 'Required Question',
        type: 'boolean',
        required: false,
        defaultValue: false,
      },
    ],
    outputSchema: {
      type: 'object',
      properties: {
        question_text: { type: 'string' },
        question_type: { type: 'string', enum: ['text', 'multiple_choice', 'rating'] },
        options: { type: 'string' },
        required: { type: 'boolean' },
      },
      required: ['question_text', 'question_type'],
    },
  },

  /**
   * SCENE ASSEMBLY BLOCK
   * For assembling complete therapeutic scenes
   */
  scene_assembly: {
    id: 'scene_assembly',
    type: 'scene_assembly',
    label: 'Scene Assembly',
    icon: 'layers',
    category: 'structure',
    description: 'Instructions for assembling a complete scene',
    fields: [
      {
        id: 'assembly_instructions',
        label: 'Assembly Instructions',
        type: 'textarea',
        required: true,
        placeholder: 'Describe how the scene should be assembled. What order? What transitions?',
        validation: {
          minLength: 20,
          maxLength: 1000,
        },
      },
      {
        id: 'include_reflection',
        label: 'Include Reflection Questions',
        type: 'boolean',
        required: false,
        defaultValue: true,
        helpText: 'Add reflection questions to the scene',
      },
    ],
    outputSchema: {
      type: 'object',
      properties: {
        assembly_instructions: { type: 'string' },
        include_reflection: { type: 'boolean' },
      },
      required: ['assembly_instructions'],
    },
  },

  /**
   * ARRAY CONTAINER BLOCK
   * Meta-block for grouping multiple blocks into arrays
   */
  array_container: {
    id: 'array_container',
    type: 'array_container',
    label: 'Array Container',
    icon: 'square-stack',
    category: 'structure',
    description: 'Groups multiple blocks into an array structure',
    fields: [
      {
        id: 'container_name',
        label: 'Container Name',
        type: 'text',
        required: true,
        placeholder: 'e.g., images, questions, scenes',
      },
      {
        id: 'allowed_types',
        label: 'Allowed Block Types',
        type: 'text',
        required: false,
        placeholder: 'Comma-separated block types (leave empty for any)',
        helpText: 'Restrict which blocks can be added to this container',
      },
      {
        id: 'min_items',
        label: 'Minimum Items',
        type: 'number',
        required: false,
        defaultValue: 1,
        validation: {
          min: 0,
        },
      },
      {
        id: 'max_items',
        label: 'Maximum Items',
        type: 'number',
        required: false,
        defaultValue: 10,
        validation: {
          min: 1,
          max: 50,
        },
      },
    ],
    outputSchema: {
      type: 'object',
      properties: {
        container_name: { type: 'string' },
        allowed_types: { type: 'string' },
        min_items: { type: 'number' },
        max_items: { type: 'number' },
      },
      required: ['container_name'],
    },
  },
};

/**
 * Validation rules for block combinations
 */
export const VALIDATION_RULES: ValidationRule[] = [
  {
    blockType: 'scene_assembly',
    min: 1,
    max: 1,
    requiredWith: ['video_introduction'],
  },
  {
    blockType: 'image_prompt',
    max: 10,
  },
  {
    blockType: 'video_prompt',
    max: 10,
  },
  {
    blockType: 'reflection_question',
    max: 20,
  },
  {
    blockType: 'survey_question',
    max: 20,
  },
  {
    blockType: 'music_generation',
    max: 3,
  },
  {
    blockType: 'quote',
    max: 1,
  },
  {
    blockType: 'therapeutic_note',
    max: 1,
  },
  {
    blockType: 'scene_suggestion',
    max: 1,
  },
];

/**
 * Get block definition by type
 */
export function getBlockDefinition(blockType: BlockType): BuildingBlock | undefined {
  return BLOCK_DEFINITIONS[blockType];
}

/**
 * Get all block definitions as array
 */
export function getAllBlockDefinitions(): BuildingBlock[] {
  return Object.values(BLOCK_DEFINITIONS);
}

/**
 * Get block definitions by category
 */
export function getBlockDefinitionsByCategory(category: string): BuildingBlock[] {
  return Object.values(BLOCK_DEFINITIONS).filter(block => block.category === category);
}
