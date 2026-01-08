/**
 * Prompt JSON Templates
 * Example JSON structures for each schema type
 * Used in prompt library JSON editor as starting templates
 *
 * IMPORTANT: These templates MUST match the TypeScript definitions in src/types/JSONSchemas.ts EXACTLY
 * All field names use snake_case with underscores
 */

export type SchemaType
  = | 'scene_card'
    | 'music_generation'
    | 'scene_suggestions'
    | 'image_references'
    | 'video_references'
    | 'reflection_questions'
    | 'therapeutic_note'
    | 'quote_extraction'
    | 'scene_visualization'
    | 'therapeutic_scene_card';

export type PromptJSONTemplate = {
  schemaType: SchemaType;
  label: string;
  description: string;
  example: any;
};

// ============================================================================
// FIELD METADATA FOR VISUAL SCHEMA BUILDER
// ============================================================================

export type FieldType = 'string' | 'number' | 'array' | 'object' | 'boolean';

export type FieldMeta = {
  name: string; // Field key (snake_case)
  displayName: string; // UI label
  description: string; // Help text
  type: FieldType;
  required: boolean;
  enablesAction?: string; // Action label this field enables
  arrayItemType?: FieldType; // For array fields
  objectFields?: FieldMeta[]; // For nested object fields
};

export type SchemaFieldConfig = {
  schemaType: SchemaType;
  label: string;
  description: string;
  icon: string;
  actions: string[]; // Action labels available for this schema
  fields: FieldMeta[];
};

/**
 * Field metadata for visual schema builder
 * Defines all fields for each schema type with display names, descriptions, and action mappings
 */
export const SCHEMA_FIELD_CONFIGS: SchemaFieldConfig[] = [
  {
    schemaType: 'therapeutic_note',
    label: 'Therapeutic Note',
    description: 'Create a structured therapeutic note with observations and themes',
    icon: 'file-text',
    actions: ['Save Note'],
    fields: [
      { name: 'title', displayName: 'Title', description: 'Title of the therapeutic note', type: 'string', required: true },
      { name: 'content', displayName: 'Content', description: 'Main content of the note in markdown format', type: 'string', required: true },
      { name: 'tags', displayName: 'Tags', description: 'Tags for categorizing the note', type: 'array', required: false, arrayItemType: 'string' },
      { name: 'keyInsights', displayName: 'Key Insights', description: 'Important observations from the session', type: 'array', required: false, arrayItemType: 'string' },
      { name: 'actionItems', displayName: 'Action Items', description: 'Follow-up actions to take', type: 'array', required: false, arrayItemType: 'string' },
    ],
  },
  {
    schemaType: 'image_references',
    label: 'Image References',
    description: 'Generate multiple image suggestions with prompts and metadata',
    icon: 'image',
    actions: ['Generate Image'],
    fields: [
      {
        name: 'images',
        displayName: 'Images',
        description: 'Array of image suggestions to generate',
        type: 'array',
        required: true,
        objectFields: [
          { name: 'title', displayName: 'Title', description: 'Name for this image', type: 'string', required: true },
          { name: 'prompt', displayName: 'Image Prompt', description: 'Detailed prompt for image generation', type: 'string', required: true, enablesAction: 'Generate Image' },
          { name: 'therapeutic_purpose', displayName: 'Therapeutic Purpose', description: 'Why this image supports the patient', type: 'string', required: true },
          { name: 'style', displayName: 'Style', description: 'Visual style (photorealistic, artistic, etc.)', type: 'string', required: false },
          { name: 'source_quote', displayName: 'Source Quote', description: 'Quote from transcript that inspired this image', type: 'string', required: false },
        ],
      },
    ],
  },
  {
    schemaType: 'video_references',
    label: 'Video References',
    description: 'Generate multiple video scene suggestions with prompts and metadata',
    icon: 'film',
    actions: ['Generate Video'],
    fields: [
      {
        name: 'videos',
        displayName: 'Videos',
        description: 'Array of video suggestions to generate',
        type: 'array',
        required: true,
        objectFields: [
          { name: 'title', displayName: 'Title', description: 'Name for this video', type: 'string', required: true },
          { name: 'reference_image_prompt', displayName: 'Reference Image Prompt', description: 'Prompt for the starting frame image', type: 'string', required: true, enablesAction: 'Generate Video' },
          { name: 'prompt', displayName: 'Animation Prompt', description: 'How to animate the image', type: 'string', required: true, enablesAction: 'Generate Video' },
          { name: 'therapeutic_purpose', displayName: 'Therapeutic Purpose', description: 'Why this video supports the patient', type: 'string', required: true },
          { name: 'duration', displayName: 'Duration', description: 'Video length in seconds', type: 'number', required: false },
          { name: 'style', displayName: 'Style', description: 'Visual style (cinematic, dreamy, etc.)', type: 'string', required: false },
          { name: 'source_quote', displayName: 'Source Quote', description: 'Quote from transcript that inspired this video', type: 'string', required: false },
          { name: 'motion_description', displayName: 'Motion Description', description: 'Brief summary of the animation', type: 'string', required: false },
        ],
      },
    ],
  },
  {
    schemaType: 'music_generation',
    label: 'Music Generation',
    description: 'Generate instrumental and lyrical music suggestions',
    icon: 'music',
    actions: ['Generate Instrumental', 'Generate Lyrical Song'],
    fields: [
      {
        name: 'instrumental_option',
        displayName: 'Instrumental Option',
        description: 'Settings for instrumental music generation',
        type: 'object',
        required: true,
        objectFields: [
          { name: 'title', displayName: 'Title', description: 'Name for this instrumental piece', type: 'string', required: true },
          { name: 'style_prompt', displayName: 'Style Prompt', description: 'Detailed music generation instructions', type: 'string', required: true, enablesAction: 'Generate Instrumental' },
          { name: 'genre_tags', displayName: 'Genre Tags', description: 'Musical genres (ambient, piano, etc.)', type: 'array', required: false, arrayItemType: 'string' },
          { name: 'mood', displayName: 'Mood', description: 'Emotional tone of the music', type: 'string', required: false },
          { name: 'music_description', displayName: 'Music Description', description: 'Description of the musical journey', type: 'string', required: false },
          { name: 'source_quotes', displayName: 'Source Quotes', description: 'Quotes that inspired this music', type: 'array', required: false, arrayItemType: 'string' },
          { name: 'rationale', displayName: 'Rationale', description: 'Why this music supports the narrative', type: 'string', required: false },
        ],
      },
      {
        name: 'lyrical_option',
        displayName: 'Lyrical Option',
        description: 'Settings for song with lyrics generation',
        type: 'object',
        required: true,
        objectFields: [
          { name: 'title', displayName: 'Title', description: 'Song title', type: 'string', required: true },
          { name: 'suggested_lyrics', displayName: 'Suggested Lyrics', description: 'Full lyrics for the song', type: 'string', required: true, enablesAction: 'Generate Lyrical Song' },
          { name: 'style_prompt', displayName: 'Style Prompt', description: 'Music generation instructions', type: 'string', required: true, enablesAction: 'Generate Lyrical Song' },
          { name: 'genre_tags', displayName: 'Genre Tags', description: 'Musical genres', type: 'array', required: false, arrayItemType: 'string' },
          { name: 'mood', displayName: 'Mood', description: 'Emotional tone', type: 'string', required: false },
          { name: 'source_quotes', displayName: 'Source Quotes', description: 'Quotes that inspired this song', type: 'array', required: false, arrayItemType: 'string' },
          { name: 'rationale', displayName: 'Rationale', description: 'Therapeutic purpose of this song', type: 'string', required: false },
        ],
      },
    ],
  },
  {
    schemaType: 'quote_extraction',
    label: 'Quote Extraction',
    description: 'Extract meaningful quotes from session transcript',
    icon: 'quote',
    actions: ['Save All Quotes'],
    fields: [
      {
        name: 'extracted_quotes',
        displayName: 'Extracted Quotes',
        description: 'Array of meaningful quotes from the transcript',
        type: 'array',
        required: true,
        objectFields: [
          { name: 'quote_text', displayName: 'Quote Text', description: 'The exact quote', type: 'string', required: true, enablesAction: 'Save All Quotes' },
          { name: 'speaker', displayName: 'Speaker', description: 'Who said this quote', type: 'string', required: true },
          { name: 'context', displayName: 'Context', description: 'Why this quote is therapeutically significant', type: 'string', required: true },
          { name: 'patient_name', displayName: 'Patient Name', description: 'Patient this quote belongs to', type: 'string', required: false },
          { name: 'tags', displayName: 'Tags', description: 'Tags for categorizing the quote', type: 'array', required: false, arrayItemType: 'string' },
        ],
      },
    ],
  },
  {
    schemaType: 'reflection_questions',
    label: 'Reflection Questions',
    description: 'Generate therapeutic reflection questions for patients',
    icon: 'help-circle',
    actions: ['Save to Template Library'],
    fields: [
      {
        name: 'questions',
        displayName: 'Questions',
        description: 'Array of reflection questions',
        type: 'array',
        required: true,
        objectFields: [
          { name: 'question', displayName: 'Question', description: 'The reflection question', type: 'string', required: true },
          { name: 'rationale', displayName: 'Rationale', description: 'Why this question matters', type: 'string', required: true },
          { name: 'placement', displayName: 'Placement', description: 'When to show this question in the story page', type: 'string', required: false },
        ],
      },
    ],
  },
  {
    schemaType: 'scene_suggestions',
    label: 'Scene Suggestions',
    description: 'Suggest multiple narrative scenes for story page creation',
    icon: 'layers',
    actions: ['Create All Scenes', 'Save as Notes'],
    fields: [
      {
        name: 'potential_scenes_by_participant',
        displayName: 'Scenes by Participant',
        description: 'Scene suggestions organized by patient',
        type: 'array',
        required: true,
        objectFields: [
          { name: 'for_patient_name', displayName: 'Patient Name', description: 'Which patient these scenes are for', type: 'string', required: true },
          {
            name: 'scenes',
            displayName: 'Scenes',
            description: 'Array of scene suggestions',
            type: 'array',
            required: true,
            objectFields: [
              { name: 'scene_title', displayName: 'Scene Title', description: 'Title of the scene', type: 'string', required: true },
              { name: 'scene_description', displayName: 'Description', description: 'What happens in this scene', type: 'string', required: true },
              { name: 'therapeutic_rationale', displayName: 'Therapeutic Rationale', description: 'Why this scene is meaningful', type: 'string', required: true },
              { name: 'scene_focus_instruction', displayName: 'Focus Instruction', description: 'What to emphasize', type: 'string', required: false },
              { name: 'key_quote', displayName: 'Key Quote', description: 'Important quote for this scene', type: 'string', required: false },
            ],
          },
        ],
      },
    ],
  },
  {
    schemaType: 'scene_card',
    label: 'Scene Card',
    description: 'Create a complete narrative scene with all components',
    icon: 'video',
    actions: ['Create Scene', 'Generate Reference Images', 'Generate Music', 'Save Reflection Questions'],
    fields: [
      { name: 'video_introduction', displayName: 'Video Introduction', description: 'Opening text for the video', type: 'string', required: true },
      {
        name: 'reference_images',
        displayName: 'Reference Images',
        description: 'Images to generate for this scene',
        type: 'array',
        required: true,
        objectFields: [
          { name: 'title', displayName: 'Title', description: 'Image title', type: 'string', required: true },
          { name: 'image_prompt', displayName: 'Image Prompt', description: 'Detailed prompt for generation', type: 'string', required: true, enablesAction: 'Generate Reference Images' },
          { name: 'patient_quote_anchor', displayName: 'Quote Anchor', description: 'Patient quote this image represents', type: 'string', required: false },
          { name: 'meaning', displayName: 'Meaning', description: 'Therapeutic meaning of this image', type: 'string', required: false },
        ],
      },
      {
        name: 'music',
        displayName: 'Music',
        description: 'Background music settings',
        type: 'object',
        required: false,
        objectFields: [
          { name: 'prompt', displayName: 'Music Prompt', description: 'Music generation instructions', type: 'string', required: true, enablesAction: 'Generate Music' },
          { name: 'mood', displayName: 'Mood', description: 'Emotional tone', type: 'string', required: false },
          { name: 'genre', displayName: 'Genre', description: 'Musical genre', type: 'string', required: false },
        ],
      },
      { name: 'patient_reflection_questions', displayName: 'Patient Reflection Questions', description: 'Questions for the patient', type: 'array', required: false, arrayItemType: 'string' },
      { name: 'group_reflection_questions', displayName: 'Group Reflection Questions', description: 'Questions for group discussion', type: 'array', required: false, arrayItemType: 'string' },
      { name: 'assembly_steps', displayName: 'Assembly Steps', description: 'Steps for assembling the scene', type: 'array', required: false, arrayItemType: 'string' },
    ],
  },
  {
    schemaType: 'therapeutic_scene_card',
    label: 'Therapeutic Scene Card',
    description: 'AI-generated scene cards with quotes and visual prompts',
    icon: 'sparkles',
    actions: [],
    fields: [
      { name: 'title', displayName: 'Title', description: 'Card title', type: 'string', required: true },
      { name: 'subtitle', displayName: 'Subtitle', description: 'Card subtitle', type: 'string', required: false },
      { name: 'patient', displayName: 'Patient', description: 'Patient name', type: 'string', required: true },
      {
        name: 'scenes',
        displayName: 'Scenes',
        description: 'Array of scene sections',
        type: 'array',
        required: true,
        objectFields: [
          { name: 'sceneNumber', displayName: 'Scene Number', description: 'Scene sequence number', type: 'number', required: true },
          {
            name: 'sections',
            displayName: 'Sections',
            description: 'Content sections for this scene',
            type: 'object',
            required: true,
            objectFields: [
              { name: 'patientQuote', displayName: 'Patient Quote', description: 'Quote anchor section', type: 'object', required: true },
              { name: 'meaning', displayName: 'Meaning', description: 'Therapist reflection section', type: 'object', required: true },
              { name: 'imagePrompt', displayName: 'Image Prompt', description: 'Image generation section', type: 'object', required: true },
              { name: 'imageToScene', displayName: 'Image to Scene', description: 'Animation direction section', type: 'object', required: true },
            ],
          },
        ],
      },
    ],
  },
  {
    schemaType: 'scene_visualization',
    label: 'Scene Visualization',
    description: 'Therapeutic scene with visual and symbolic elements',
    icon: 'eye',
    actions: ['Generate Image', 'Save as Note'],
    fields: [
      { name: 'scene_title', displayName: 'Scene Title', description: 'Title for the visualization', type: 'string', required: true },
      { name: 'visual_description', displayName: 'Visual Description', description: 'Detailed visual description', type: 'string', required: true },
      { name: 'image_prompt', displayName: 'Image Prompt', description: 'Prompt for image generation', type: 'string', required: true, enablesAction: 'Generate Image' },
      { name: 'mood', displayName: 'Mood', description: 'Emotional atmosphere', type: 'string', required: false },
      { name: 'symbolic_elements', displayName: 'Symbolic Elements', description: 'Symbolic meanings in the scene', type: 'array', required: false, arrayItemType: 'string' },
      { name: 'therapeutic_purpose', displayName: 'Therapeutic Purpose', description: 'Why this visualization helps', type: 'string', required: false },
    ],
  },
];

/**
 * Get field config by schema type
 */
export function getFieldConfigByType(schemaType: SchemaType): SchemaFieldConfig | undefined {
  return SCHEMA_FIELD_CONFIGS.find(c => c.schemaType === schemaType);
}

export const PROMPT_JSON_TEMPLATES: PromptJSONTemplate[] = [
  {
    schemaType: 'therapeutic_note',
    label: 'Therapeutic Note',
    description: 'Create a structured therapeutic note with observations and themes',
    example: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['therapeutic_note'] },
        title: { type: 'string' },
        content: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        keyInsights: { type: 'array', items: { type: 'string' } },
        actionItems: { type: 'array', items: { type: 'string' } },
      },
      required: ['schemaType', 'title', 'content'],
    },
  },
  {
    schemaType: 'image_references',
    label: 'Image References',
    description: 'Generate multiple image suggestions with prompts and metadata',
    example: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['image_references'] },
        images: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              prompt: { type: 'string' },
              style: { type: 'string' },
              therapeutic_purpose: { type: 'string' },
              source_quote: { type: 'string' },
            },
            required: ['title', 'prompt', 'therapeutic_purpose'],
          },
        },
      },
      required: ['schemaType', 'images'],
    },
  },
  {
    schemaType: 'video_references',
    label: 'Video References',
    description: 'Generate multiple video scene suggestions with prompts and metadata',
    example: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['video_references'] },
        videos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              prompt: { type: 'string' },
              reference_image_prompt: { type: 'string' },
              duration: { type: 'number' },
              style: { type: 'string' },
              therapeutic_purpose: { type: 'string' },
              source_quote: { type: 'string' },
              motion_description: { type: 'string' },
            },
            required: ['title', 'prompt', 'therapeutic_purpose'],
          },
        },
      },
      required: ['schemaType', 'videos'],
    },
  },
  {
    schemaType: 'music_generation',
    label: 'Music Generation',
    description: 'Generate instrumental and lyrical music suggestions',
    example: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['music_generation'] },
        instrumental_option: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            genre_tags: { type: 'array', items: { type: 'string' } },
            mood: { type: 'string' },
            music_description: { type: 'string' },
            style_prompt: { type: 'string' },
            source_quotes: { type: 'array', items: { type: 'string' } },
            rationale: { type: 'string' },
          },
          required: ['title', 'style_prompt'],
        },
        lyrical_option: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            genre_tags: { type: 'array', items: { type: 'string' } },
            mood: { type: 'string' },
            suggested_lyrics: { type: 'string' },
            style_prompt: { type: 'string' },
            source_quotes: { type: 'array', items: { type: 'string' } },
            rationale: { type: 'string' },
          },
          required: ['title', 'suggested_lyrics', 'style_prompt'],
        },
      },
      required: ['schemaType', 'instrumental_option', 'lyrical_option'],
    },
  },
  {
    schemaType: 'scene_suggestions',
    label: 'Scene Suggestions',
    description: 'Suggest multiple narrative scenes for story page creation',
    example: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['scene_suggestions'] },
        potential_scenes_by_participant: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              for_patient_name: { type: 'string' },
              scenes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    scene_title: { type: 'string' },
                    scene_description: { type: 'string' },
                    scene_focus_instruction: { type: 'string' },
                    key_quote: { type: 'string' },
                    therapeutic_rationale: { type: 'string' },
                  },
                  required: ['scene_title', 'scene_description', 'therapeutic_rationale'],
                },
              },
            },
            required: ['for_patient_name', 'scenes'],
          },
        },
      },
      required: ['schemaType', 'potential_scenes_by_participant'],
    },
  },
  {
    schemaType: 'reflection_questions',
    label: 'Reflection Questions',
    description: 'Generate therapeutic reflection questions for patients',
    example: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['reflection_questions'] },
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              rationale: { type: 'string' },
              placement: { type: 'string' },
            },
            required: ['question', 'rationale'],
          },
        },
      },
      required: ['schemaType', 'questions'],
    },
  },
  {
    schemaType: 'scene_card',
    label: 'Scene Card',
    description: 'Create a complete narrative scene with all components for story page generation',
    example: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['scene_card'] },
        video_introduction: { type: 'string' },
        reference_images: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              patient_quote_anchor: { type: 'string' },
              meaning: { type: 'string' },
              image_prompt: { type: 'string' },
            },
            required: ['title', 'image_prompt'],
          },
        },
        music: {
          type: 'object',
          properties: {
            prompt: { type: 'string' },
            mood: { type: 'string' },
            genre: { type: 'string' },
          },
        },
        patient_reflection_questions: {
          type: 'array',
          items: { type: 'string' },
        },
        group_reflection_questions: {
          type: 'array',
          items: { type: 'string' },
        },
        assembly_steps: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['schemaType', 'video_introduction', 'reference_images'],
    },
  },
  {
    schemaType: 'quote_extraction',
    label: 'Quote Extraction',
    description: 'Extract meaningful quotes from session transcript',
    example: {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['quote_extraction'] },
        extracted_quotes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quote_text: { type: 'string' },
              speaker: { type: 'string' },
              context: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
            },
            required: ['quote_text', 'speaker', 'context'],
          },
        },
      },
      required: ['schemaType', 'extracted_quotes'],
    },
  },
];

/**
 * Get template by schema type
 */
export function getTemplateByType(schemaType: SchemaType): PromptJSONTemplate | undefined {
  return PROMPT_JSON_TEMPLATES.find(t => t.schemaType === schemaType);
}

/**
 * Get all schema types
 */
export function getAllSchemaTypes(): SchemaType[] {
  return PROMPT_JSON_TEMPLATES.map(t => t.schemaType);
}

/**
 * Get formatted template JSON string
 */
export function getTemplateJSON(schemaType: SchemaType): string {
  const template = getTemplateByType(schemaType);
  return template ? JSON.stringify(template.example, null, 2) : '{}';
}
