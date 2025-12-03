/**
 * Property Templates
 * Pre-configured nested structures for complex properties
 * Based on exact patterns from seed-system-prompts.ts database schemas
 */

export interface PropertyTemplateItem {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description?: string;
  items?: {
    type: 'string' | 'number' | 'boolean' | 'object';
    properties?: PropertyTemplateItem[];
  };
  properties?: PropertyTemplateItem[];
}

export interface PropertyTemplate {
  propertyName: string;
  autoPopulate: boolean;
  category: string;
  description: string;
  structure: PropertyTemplateItem;
}

/**
 * All property templates with exact structures from database
 */
export const PROPERTY_TEMPLATES: PropertyTemplate[] = [
  // ============================================
  // SCENE_CARD PROPERTIES
  // ============================================
  {
    propertyName: 'reference_images',
    autoPopulate: true,
    category: 'visual',
    description: 'Array of reference images for scene (4 nested properties)',
    structure: {
      name: 'reference_images',
      type: 'array',
      required: true,
      description: 'Reference images for the scene',
      items: {
        type: 'object',
        properties: [
          { name: 'title', type: 'string', required: true, description: 'Image title' },
          { name: 'patient_quote_anchor', type: 'string', required: false, description: 'Quote that anchors this image' },
          { name: 'meaning', type: 'string', required: false, description: 'Therapeutic meaning' },
          { name: 'image_prompt', type: 'string', required: true, description: 'DALL-E generation prompt' },
        ],
      },
    },
  },
  {
    propertyName: 'music',
    autoPopulate: true,
    category: 'music',
    description: 'Music object with 3 properties (prompt, mood, genre)',
    structure: {
      name: 'music',
      type: 'object',
      required: false,
      description: 'Background music configuration',
      properties: [
        { name: 'prompt', type: 'string', required: false, description: 'Music generation prompt' },
        { name: 'mood', type: 'string', required: false, description: 'Emotional mood' },
        { name: 'genre', type: 'string', required: false, description: 'Music genre' },
      ],
    },
  },
  {
    propertyName: 'patient_reflection_questions',
    autoPopulate: false, // Simple array of strings, no template needed
    category: 'questions',
    description: 'Array of patient reflection questions (strings)',
    structure: {
      name: 'patient_reflection_questions',
      type: 'array',
      required: false,
      items: { type: 'string' },
    },
  },
  {
    propertyName: 'group_reflection_questions',
    autoPopulate: false, // Simple array of strings
    category: 'questions',
    description: 'Array of group reflection questions (strings)',
    structure: {
      name: 'group_reflection_questions',
      type: 'array',
      required: false,
      items: { type: 'string' },
    },
  },
  {
    propertyName: 'assembly_steps',
    autoPopulate: false, // Simple array of strings
    category: 'scenes',
    description: 'Array of assembly steps (strings)',
    structure: {
      name: 'assembly_steps',
      type: 'array',
      required: false,
      items: { type: 'string' },
    },
  },

  // ============================================
  // SCENE_SUGGESTIONS PROPERTIES
  // ============================================
  {
    propertyName: 'potential_scenes_by_participant',
    autoPopulate: true,
    category: 'scenes',
    description: '3-level nested structure: participants → scenes array → 5 properties',
    structure: {
      name: 'potential_scenes_by_participant',
      type: 'array',
      required: true,
      description: 'Scene suggestions grouped by participant',
      items: {
        type: 'object',
        properties: [
          { name: 'for_patient_name', type: 'string', required: true, description: 'Patient name' },
          {
            name: 'scenes',
            type: 'array',
            required: true,
            description: 'Array of scene suggestions',
            items: {
              type: 'object',
              properties: [
                { name: 'scene_title', type: 'string', required: true, description: 'Scene title' },
                { name: 'scene_description', type: 'string', required: true, description: 'Scene description' },
                { name: 'scene_focus_instruction', type: 'string', required: false, description: 'Focus instruction' },
                { name: 'key_quote', type: 'string', required: false, description: 'Key quote from transcript' },
                { name: 'therapeutic_rationale', type: 'string', required: true, description: 'Therapeutic reasoning' },
              ],
            },
          },
        ],
      },
    },
  },

  // ============================================
  // QUOTE_EXTRACTION PROPERTIES
  // ============================================
  {
    propertyName: 'extracted_quotes',
    autoPopulate: true,
    category: 'quotes',
    description: 'Array of quotes with 4 properties (quote_text, speaker, context, tags)',
    structure: {
      name: 'extracted_quotes',
      type: 'array',
      required: true,
      description: 'Array of extracted quotes',
      items: {
        type: 'object',
        properties: [
          { name: 'quote_text', type: 'string', required: true, description: 'The exact quote' },
          { name: 'speaker', type: 'string', required: true, description: 'Who said it' },
          { name: 'context', type: 'string', required: true, description: 'Context of the quote' },
          { name: 'tags', type: 'array', required: false, description: 'Tags for categorization', items: { type: 'string' } },
        ],
      },
    },
  },

  // ============================================
  // MUSIC_GENERATION PROPERTIES
  // ============================================
  {
    propertyName: 'instrumental_option',
    autoPopulate: true,
    category: 'music',
    description: 'Instrumental music object with 7 properties',
    structure: {
      name: 'instrumental_option',
      type: 'object',
      required: true,
      description: 'Instrumental music option',
      properties: [
        { name: 'title', type: 'string', required: true, description: 'Music title' },
        { name: 'genre_tags', type: 'array', required: false, items: { type: 'string' }, description: 'Genre tags' },
        { name: 'mood', type: 'string', required: false, description: 'Emotional mood' },
        { name: 'music_description', type: 'string', required: false, description: 'Description of the music' },
        { name: 'style_prompt', type: 'string', required: true, description: 'AI music generation prompt' },
        { name: 'source_quotes', type: 'array', required: false, items: { type: 'string' }, description: 'Source quotes' },
        { name: 'rationale', type: 'string', required: false, description: 'Therapeutic rationale' },
      ],
    },
  },
  {
    propertyName: 'lyrical_option',
    autoPopulate: true,
    category: 'music',
    description: 'Lyrical music object with 7 properties',
    structure: {
      name: 'lyrical_option',
      type: 'object',
      required: true,
      description: 'Lyrical song option',
      properties: [
        { name: 'title', type: 'string', required: true, description: 'Song title' },
        { name: 'genre_tags', type: 'array', required: false, items: { type: 'string' }, description: 'Genre tags' },
        { name: 'mood', type: 'string', required: false, description: 'Emotional mood' },
        { name: 'suggested_lyrics', type: 'string', required: true, description: 'Suggested lyrics' },
        { name: 'style_prompt', type: 'string', required: true, description: 'AI music generation prompt' },
        { name: 'source_quotes', type: 'array', required: false, items: { type: 'string' }, description: 'Source quotes' },
        { name: 'rationale', type: 'string', required: false, description: 'Therapeutic rationale' },
      ],
    },
  },

  // ============================================
  // IMAGE_REFERENCES PROPERTIES
  // ============================================
  {
    propertyName: 'images',
    autoPopulate: true,
    category: 'visual',
    description: 'Array of images with 5 properties',
    structure: {
      name: 'images',
      type: 'array',
      required: true,
      description: 'Array of image references',
      items: {
        type: 'object',
        properties: [
          { name: 'title', type: 'string', required: true, description: 'Image title' },
          { name: 'image_prompt', type: 'string', required: true, description: 'DALL-E prompt' },
          { name: 'style', type: 'string', required: false, description: 'Visual style' },
          { name: 'source_quote', type: 'string', required: false, description: 'Source quote' },
          { name: 'therapeutic_purpose', type: 'string', required: false, description: 'Therapeutic purpose' },
        ],
      },
    },
  },

  // ============================================
  // REFLECTION_QUESTIONS PROPERTIES
  // ============================================
  {
    propertyName: 'questions',
    autoPopulate: true,
    category: 'questions',
    description: 'Array of questions with 4 properties',
    structure: {
      name: 'questions',
      type: 'array',
      required: true,
      description: 'Array of reflection questions',
      items: {
        type: 'object',
        properties: [
          { name: 'question', type: 'string', required: true, description: 'Question text' },
          { name: 'rationale', type: 'string', required: false, description: 'Why ask this question' },
          { name: 'placement', type: 'string', required: false, description: 'Where to place in workflow' },
          { name: 'connection_to_goals', type: 'string', required: false, description: 'Connection to goals' },
        ],
      },
    },
  },

  // ============================================
  // METAPHOR_EXTRACTION PROPERTIES
  // ============================================
  {
    propertyName: 'metaphors',
    autoPopulate: true,
    category: 'metaphors',
    description: 'Array of metaphors with 4 properties',
    structure: {
      name: 'metaphors',
      type: 'array',
      required: true,
      description: 'Array of extracted metaphors',
      items: {
        type: 'object',
        properties: [
          { name: 'exact_language', type: 'string', required: true, description: 'Exact metaphorical language used' },
          { name: 'symbolic_meaning', type: 'string', required: true, description: 'Symbolic meaning' },
          { name: 'visual_representation', type: 'string', required: false, description: 'How to visualize it' },
          { name: 'exploration_suggestions', type: 'string', required: false, description: 'Exploration suggestions' },
        ],
      },
    },
  },

  // ============================================
  // TIMELINE_VISUALIZATION PROPERTIES
  // ============================================
  {
    propertyName: 'key_moments',
    autoPopulate: true,
    category: 'scenes',
    description: 'Array of key moments with 5 properties',
    structure: {
      name: 'key_moments',
      type: 'array',
      required: true,
      description: 'Key moments in timeline',
      items: {
        type: 'object',
        properties: [
          { name: 'date', type: 'string', required: false, description: 'Date of moment' },
          { name: 'event', type: 'string', required: true, description: 'Event description' },
          { name: 'quote', type: 'string', required: false, description: 'Related quote' },
          { name: 'significance', type: 'string', required: true, description: 'Why this moment matters' },
          { name: 'story_page_potential', type: 'string', required: false, description: 'Potential for story page' },
        ],
      },
    },
  },

  // ============================================
  // STRENGTHS_RESOURCES PROPERTIES
  // ============================================
  {
    propertyName: 'resources',
    autoPopulate: true,
    category: 'strengths',
    description: 'Array of resources with 5 properties',
    structure: {
      name: 'resources',
      type: 'array',
      required: true,
      description: 'Available resources',
      items: {
        type: 'object',
        properties: [
          { name: 'resource', type: 'string', required: true, description: 'Resource name' },
          { name: 'category', type: 'string', required: false, description: 'Resource category' },
          { name: 'demonstration', type: 'string', required: false, description: 'How it was demonstrated' },
          { name: 'leverage_opportunities', type: 'string', required: false, description: 'How to leverage it' },
          { name: 'healing_support', type: 'string', required: false, description: 'Healing support it provides' },
        ],
      },
    },
  },

  // ============================================
  // BARRIERS_CHALLENGES PROPERTIES
  // ============================================
  {
    propertyName: 'barriers',
    autoPopulate: true,
    category: 'goals',
    description: 'Array of barriers with 5 properties',
    structure: {
      name: 'barriers',
      type: 'array',
      required: true,
      description: 'Barriers to goals',
      items: {
        type: 'object',
        properties: [
          { name: 'barrier', type: 'string', required: true, description: 'Barrier description' },
          { name: 'category', type: 'string', required: false, description: 'Barrier category' },
          { name: 'impact', type: 'string', required: false, description: 'Impact on goals' },
          { name: 'current_approach', type: 'string', required: false, description: 'Current approach to address it' },
          { name: 'interventions', type: 'string', required: false, description: 'Suggested interventions' },
        ],
      },
    },
  },

  // ============================================
  // JOURNALING_PROMPTS PROPERTIES
  // ============================================
  {
    propertyName: 'prompts',
    autoPopulate: true,
    category: 'questions',
    description: 'Array of prompts with 3 properties',
    structure: {
      name: 'prompts',
      type: 'array',
      required: true,
      description: 'Journaling prompts',
      items: {
        type: 'object',
        properties: [
          { name: 'prompt', type: 'string', required: true, description: 'Prompt text' },
          { name: 'guidance', type: 'string', required: false, description: 'Guidance for answering' },
          { name: 'therapeutic_objective', type: 'string', required: false, description: 'Therapeutic objective' },
        ],
      },
    },
  },
];

/**
 * Get template by property name
 */
export function getPropertyTemplate(propertyName: string): PropertyTemplate | undefined {
  return PROPERTY_TEMPLATES.find((t) => t.propertyName === propertyName);
}

/**
 * Get all properties that have auto-populate templates
 */
export function getAutoPopulatePropertyNames(): string[] {
  return PROPERTY_TEMPLATES.filter((t) => t.autoPopulate).map((t) => t.propertyName);
}

/**
 * Check if a property has an auto-populate template
 */
export function hasAutoPopulateTemplate(propertyName: string): boolean {
  const template = getPropertyTemplate(propertyName);
  return template !== undefined && template.autoPopulate === true;
}
