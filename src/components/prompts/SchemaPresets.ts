/**
 * Schema Presets
 * Pre-configured JSON schema templates for common prompt output patterns
 */

export interface SchemaPreset {
  id: string;
  name: string;
  description: string;
  category: 'simple' | 'medium' | 'complex';
  schemaType: string;
  schema: any;
}

export const SCHEMA_PRESETS: SchemaPreset[] = [
  {
    id: 'therapeutic_note',
    name: 'Therapeutic Note',
    description: 'Simple note with title, content, themes, and tags',
    category: 'simple',
    schemaType: 'therapeutic_note',
    schema: {
      type: 'object',
      properties: {
        schemaType: {
          type: 'string',
          enum: ['therapeutic_note'],
          description: 'Schema type identifier',
        },
        note_title: {
          type: 'string',
          description: 'Title of the therapeutic note',
        },
        note_content: {
          type: 'string',
          description: 'Main content of the note',
        },
        key_themes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Key therapeutic themes identified',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorization',
        },
      },
      required: ['schemaType', 'note_title', 'note_content'],
    },
  },
  {
    id: 'quote_extraction',
    name: 'Quote Extraction',
    description: 'Extract meaningful quotes with context and tags',
    category: 'medium',
    schemaType: 'quote_extraction',
    schema: {
      type: 'object',
      properties: {
        schemaType: {
          type: 'string',
          enum: ['quote_extraction'],
          description: 'Schema type identifier',
        },
        extracted_quotes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quote_text: {
                type: 'string',
                description: 'The exact quote from transcript',
              },
              speaker: {
                type: 'string',
                description: 'Who said this quote',
              },
              context: {
                type: 'string',
                description: 'Context surrounding the quote',
              },
              therapeutic_significance: {
                type: 'string',
                description: 'Why this quote is therapeutically significant',
              },
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Tags for categorization',
              },
            },
            required: ['quote_text', 'speaker', 'context'],
          },
          description: 'Array of extracted quotes',
        },
      },
      required: ['schemaType', 'extracted_quotes'],
    },
  },
  {
    id: 'scene_card',
    name: 'Scene Card',
    description: 'Complete scene with images, music, and reflection questions',
    category: 'complex',
    schemaType: 'scene_card',
    schema: {
      type: 'object',
      properties: {
        schemaType: {
          type: 'string',
          enum: ['scene_card'],
          description: 'Schema type identifier',
        },
        video_introduction: {
          type: 'string',
          description: 'Patient-facing introduction text with specific Markdown headings',
        },
        reference_images: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage_name: {
                type: 'string',
                description: 'Name of this stage in the sequence',
              },
              title: {
                type: 'string',
                description: 'Title of the image',
              },
              image_prompt: {
                type: 'string',
                description: 'DALL-E/Flux prompt for image generation',
              },
              meaning: {
                type: 'string',
                description: 'Therapeutic meaning of this image',
              },
              patient_quote_anchor: {
                type: 'string',
                description: 'Exact quote from transcript that anchors this image',
              },
              animation_instructions: {
                type: 'string',
                description: 'Instructions for animating this image',
              },
            },
            required: ['stage_name', 'title', 'image_prompt', 'meaning', 'patient_quote_anchor', 'animation_instructions'],
          },
          description: 'Array of reference images for the scene',
        },
        music: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'Music generation prompt',
            },
            duration_seconds: {
              type: 'number',
              description: 'Duration of music in seconds',
            },
            segment_timing: {
              type: 'array',
              items: { type: 'number' },
              description: 'Timing for each segment',
            },
            fade_out: {
              type: 'boolean',
              description: 'Whether to fade out at the end',
            },
            instrument_focus: {
              type: 'array',
              items: { type: 'string' },
              description: 'Instruments to focus on',
            },
            progression_note: {
              type: 'string',
              description: 'Note about musical progression',
            },
          },
          required: ['prompt', 'duration_seconds'],
          description: 'Background music for the scene',
        },
        patient_reflection_questions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Questions for patient reflection',
        },
        group_reflection_questions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Questions for group reflection',
        },
        assembly_steps: {
          type: 'array',
          items: { type: 'string' },
          description: 'Steps for assembling the final scene',
        },
      },
      required: ['schemaType', 'video_introduction', 'reference_images', 'music', 'patient_reflection_questions', 'assembly_steps'],
    },
  },
  {
    id: 'scene_suggestions',
    name: 'Scene Suggestions',
    description: 'Multi-patient scene suggestions with nested structure',
    category: 'complex',
    schemaType: 'scene_suggestions',
    schema: {
      type: 'object',
      properties: {
        schemaType: {
          type: 'string',
          enum: ['scene_suggestions'],
          description: 'Schema type identifier',
        },
        potential_scenes_by_participant: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              for_patient_name: {
                type: 'string',
                description: 'Name of the patient these scenes are for',
              },
              scenes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    scene_title: {
                      type: 'string',
                      description: 'Title of the suggested scene',
                    },
                    scene_description: {
                      type: 'string',
                      description: 'Description of what the scene will show',
                    },
                    key_quote: {
                      type: 'string',
                      description: 'Key quote that inspired this scene',
                    },
                    therapeutic_rationale: {
                      type: 'string',
                      description: 'Why this scene is therapeutically valuable',
                    },
                    scene_focus_instruction: {
                      type: 'string',
                      description: 'Specific instruction for creating this scene',
                    },
                  },
                  required: ['scene_title', 'scene_description', 'therapeutic_rationale'],
                },
                description: 'Array of scene suggestions',
              },
            },
            required: ['for_patient_name', 'scenes'],
          },
          description: 'Scene suggestions grouped by participant',
        },
      },
      required: ['schemaType', 'potential_scenes_by_participant'],
    },
  },
  {
    id: 'music_generation',
    name: 'Music Generation',
    description: 'Two music options: instrumental and lyrical',
    category: 'complex',
    schemaType: 'music_generation',
    schema: {
      type: 'object',
      properties: {
        schemaType: {
          type: 'string',
          enum: ['music_generation'],
          description: 'Schema type identifier',
        },
        instrumental_option: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Title of the instrumental piece',
            },
            genre_tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Genre tags for categorization',
            },
            mood: {
              type: 'string',
              description: 'Emotional mood of the music',
            },
            music_description: {
              type: 'string',
              description: 'Description of the music',
            },
            style_prompt: {
              type: 'string',
              description: 'AI music generation prompt',
            },
            source_quotes: {
              type: 'array',
              items: { type: 'string' },
              description: 'Quotes that inspired this music',
            },
            rationale: {
              type: 'string',
              description: 'Therapeutic rationale',
            },
          },
          required: ['title', 'style_prompt'],
          description: 'Instrumental music option',
        },
        lyrical_option: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Title of the song',
            },
            genre_tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Genre tags for categorization',
            },
            mood: {
              type: 'string',
              description: 'Emotional mood of the song',
            },
            suggested_lyrics: {
              type: 'string',
              description: 'Suggested lyrics for the song',
            },
            style_prompt: {
              type: 'string',
              description: 'AI music generation prompt',
            },
            source_quotes: {
              type: 'array',
              items: { type: 'string' },
              description: 'Quotes that inspired this song',
            },
            rationale: {
              type: 'string',
              description: 'Therapeutic rationale',
            },
          },
          required: ['title', 'suggested_lyrics', 'style_prompt'],
          description: 'Lyrical song option',
        },
      },
      required: ['schemaType', 'instrumental_option', 'lyrical_option'],
    },
  },
];

/**
 * Get preset by ID
 */
export function getPresetById(id: string): SchemaPreset | undefined {
  return SCHEMA_PRESETS.find((preset) => preset.id === id);
}

/**
 * Get presets by category
 */
export function getPresetsByCategory(category: 'simple' | 'medium' | 'complex'): SchemaPreset[] {
  return SCHEMA_PRESETS.filter((preset) => preset.category === category);
}
