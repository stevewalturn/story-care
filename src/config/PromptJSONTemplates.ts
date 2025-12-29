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
